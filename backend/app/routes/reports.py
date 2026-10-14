import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User
from app.models.report_history import ReportHistory
from app.models.scheduled_report import ScheduledReport
from app.schemas.report import ReportGenerateRequest, ReportExportRequest, ScheduledReportCreate, ScheduledReportUpdate, REPORT_TYPES
from app.services.report_service import report_response, export_report, calculate_next_run

router = APIRouter(prefix="/reports", tags=["Reports"])
REPORT_MANAGER_ROLES=("COMPANY_ADMIN", "SUPER_ADMIN")


def _schedule_dict(s):
    return {"id":s.id,"report_type":s.report_type,"report_name":s.report_name,"filters":json.loads(s.filters_json or "{}"),
            "frequency":s.frequency,"execution_time":s.execution_time.isoformat(),"recipients":json.loads(s.recipients_json or "[]"),
            "export_format":s.export_format,"is_active":s.is_active,"last_run_at":s.last_run_at,"last_report_history_id":s.last_report_history_id,"last_status":s.last_status,
            "last_error":s.last_error,"next_run_at":s.next_run_at,"created_at":s.created_at,"updated_at":s.updated_at}


@router.get("/types")
def report_types(current_user: User = Depends(get_current_user)):
    return [{"value":k,"label":v} for k,v in REPORT_TYPES.items()]


@router.post("/generate")
def generate_report(payload: ReportGenerateRequest, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    return report_response(db,current_user,payload.report_type,payload.filters,payload.page,payload.page_size,payload.sort_by,payload.sort_order)


@router.post("/export")
def export_generated_report(payload: ReportExportRequest, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    try:
        path, history=export_report(db,current_user,payload.report_type,payload.filters,payload.export_format,payload.sort_by,payload.sort_order)
        return FileResponse(path, filename=path.name, media_type="text/csv" if payload.export_format=="CSV" else "application/pdf",
                            headers={"X-Report-History-Id":str(history.id)})
    except Exception as exc:
        raise HTTPException(500, f"Report export failed: {exc}") from exc


@router.get("/history")
def report_history(page:int=Query(1,ge=1),page_size:int=Query(20,ge=1,le=100),db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    q=db.query(ReportHistory).filter(ReportHistory.company_id==current_user.company_id).order_by(ReportHistory.generated_at.desc())
    total=q.count(); items=q.offset((page-1)*page_size).limit(page_size).all()
    return {"items":[{"id":x.id,"report_type":x.report_type,"report_name":x.report_name,"generated_by":x.generated_by,"generated_at":x.generated_at,
            "applied_filters":json.loads(x.applied_filters or "{}"),"report_period":x.report_period,"format":x.export_format,"status":x.status,
            "failure_reason":x.failure_reason,"row_count":x.row_count,"download_available":bool(x.file_path)} for x in items],
            "total":total,"page":page,"page_size":page_size,"total_pages":(total+page_size-1)//page_size}


@router.get("/history/{history_id}/download")
def download_history(history_id:int,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    item=db.query(ReportHistory).filter(ReportHistory.id==history_id,ReportHistory.company_id==current_user.company_id).first()
    if not item or not item.file_path or not Path(item.file_path).exists(): raise HTTPException(404,"Report file not found")
    return FileResponse(item.file_path,filename=Path(item.file_path).name)


@router.get("/schedules")
def list_schedules(db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    q=db.query(ScheduledReport).filter(ScheduledReport.company_id==current_user.company_id).order_by(ScheduledReport.created_at.desc()).all()
    return [_schedule_dict(x) for x in q]


@router.post("/schedules")
def create_schedule(payload:ScheduledReportCreate,db:Session=Depends(get_db),current_user:User=Depends(require_roles(*REPORT_MANAGER_ROLES))):
    s=ScheduledReport(company_id=current_user.company_id,created_by=current_user.id,report_type=payload.report_type,report_name=payload.report_name,
                      filters_json=json.dumps(payload.filters.model_dump(exclude_none=True),default=str),frequency=payload.frequency.upper(),execution_time=payload.execution_time,
                      recipients_json=json.dumps(payload.recipients),export_format=payload.export_format,is_active=payload.is_active)
    db.add(s); db.flush(); s.next_run_at=calculate_next_run(s); db.commit(); db.refresh(s)
    return _schedule_dict(s)


@router.put("/schedules/{schedule_id}")
def update_schedule(schedule_id:int,payload:ScheduledReportUpdate,db:Session=Depends(get_db),current_user:User=Depends(require_roles(*REPORT_MANAGER_ROLES))):
    s=db.query(ScheduledReport).filter(ScheduledReport.id==schedule_id,ScheduledReport.company_id==current_user.company_id).first()
    if not s: raise HTTPException(404,"Scheduled report not found")
    s.report_type=payload.report_type;s.report_name=payload.report_name;s.filters_json=json.dumps(payload.filters.model_dump(exclude_none=True),default=str)
    s.frequency=payload.frequency.upper();s.execution_time=payload.execution_time;s.recipients_json=json.dumps(payload.recipients);s.export_format=payload.export_format;s.is_active=payload.is_active
    s.next_run_at=calculate_next_run(s) if s.is_active else None;db.commit();db.refresh(s);return _schedule_dict(s)


@router.patch("/schedules/{schedule_id}/toggle")
def toggle_schedule(schedule_id:int,db:Session=Depends(get_db),current_user:User=Depends(require_roles(*REPORT_MANAGER_ROLES))):
    s=db.query(ScheduledReport).filter(ScheduledReport.id==schedule_id,ScheduledReport.company_id==current_user.company_id).first()
    if not s: raise HTTPException(404,"Scheduled report not found")
    s.is_active=not s.is_active;s.next_run_at=calculate_next_run(s) if s.is_active else None;db.commit();db.refresh(s);return _schedule_dict(s)


@router.delete("/schedules/{schedule_id}")
def delete_schedule(schedule_id:int,db:Session=Depends(get_db),current_user:User=Depends(require_roles(*REPORT_MANAGER_ROLES))):
    s=db.query(ScheduledReport).filter(ScheduledReport.id==schedule_id,ScheduledReport.company_id==current_user.company_id).first()
    if not s: raise HTTPException(404,"Scheduled report not found")
    db.delete(s);db.commit();return {"message":"Scheduled report deleted"}
