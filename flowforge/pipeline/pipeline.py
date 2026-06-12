import logging
from typing import Callable, Dict, List, Optional

from flowforge.data.schemas import LogisticsEvent, Disruption, DiagnosisResult
from flowforge.agents.watcher import WatcherAgent
from flowforge.agents.diagnosis import DiagnosisAgent

logger = logging.getLogger("flowforge.pipeline")

class EventIngestionPipeline:
    def __init__(
        self,
        watcher: WatcherAgent,
        diagnosis_agent: DiagnosisAgent,
        on_disruption_detected: Optional[Callable[[Disruption], None]] = None,
        on_diagnosis_complete: Optional[Callable[[DiagnosisResult], None]] = None
    ):
        """
        Initializes the event ingestion pipeline.
        
        Args:
            watcher: An instance of the WatcherAgent.
            diagnosis_agent: An instance of the DiagnosisAgent.
            on_disruption_detected: Optional callback when a disruption is detected.
            on_diagnosis_complete: Optional callback when a diagnosis completes.
        """
        self.watcher = watcher
        self.diagnosis_agent = diagnosis_agent
        self.on_disruption_detected = on_disruption_detected
        self.on_diagnosis_complete = on_diagnosis_complete

    def ingest_event(self, event: LogisticsEvent) -> Optional[DiagnosisResult]:
        """
        Ingests a raw LogisticsEvent, routes it to the Watcher to detect disruptions,
        and routes any detected disruptions to the Diagnosis Agent.
        
        This method is synchronous and queue-ready (e.g. can be run within a Celery task).
        """
        logger.info(f"Pipeline ingesting event: {event.event_id} ({event.event_type})")
        
        # 1. Anomaly detection via Watcher
        disruption = self.watcher.analyze_event(event)
        if not disruption:
            logger.debug(f"Event {event.event_id} analyzed. No disruption detected.")
            return None
            
        logger.warning(
            f"Disruption detected! ID: {disruption.disruption_id}, "
            f"Type: {disruption.event_type.value}, Entity: {disruption.entity_id}"
        )
        
        if self.on_disruption_detected:
            try:
                self.on_disruption_detected(disruption)
            except Exception as e:
                logger.error(f"Error in on_disruption_detected callback: {str(e)}")
                
        # 2. Impact diagnosis via Diagnosis Agent
        diagnosis = self.diagnosis_agent.diagnose(disruption)
        logger.info(
            f"Diagnosis completed. Severity: {diagnosis.severity.value}, "
            f"Blast Radius: {diagnosis.blast_radius}, Orders affected: {diagnosis.affected_orders}"
        )
        
        if self.on_diagnosis_complete:
            try:
                self.on_diagnosis_complete(diagnosis)
            except Exception as e:
                logger.error(f"Error in on_diagnosis_complete callback: {str(e)}")
                
        return diagnosis

    def ingest_batch(self, events: List[LogisticsEvent]) -> List[DiagnosisResult]:
        """Ingests a batch of events and returns all diagnosis results."""
        results = []
        for event in events:
            res = self.ingest_event(event)
            if res:
                results.append(res)
        return results

# Example Celery wrapper draft:
# @app.task
# def celery_ingest_event(event_data: dict):
#     event = LogisticsEvent.model_validate(event_data)
#     # fetch active dataset and init agents...
#     pipeline = EventIngestionPipeline(watcher, diagnosis_agent)
#     result = pipeline.ingest_event(event)
#     return result.model_dump() if result else None
