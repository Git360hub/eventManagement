import { useEffect, useRef, useState } from "react";
import type EventModel from "../../models/EventModel";
import eventsServices from "../../services/eventsServices";
import useAlertContext from "../../hooks/useAlertContext";
import PageHeader from "../../components/PageHeader/PageHeader";
import EventGrid from "../../components/EventGrid/EventGrid";
import EventCard from "../../components/EventCard/EventCard";
import Button from "../../components/Button/Button";
import Select from "../../components/Select/Select";
import type { DateFilterType } from "../../constants/dateFiltersTypes";
import DATE_FILTER_TYPES from "../../constants/dateFiltersTypes";
import classes from "./EventsPage.module.css";
import type { DocumentData, DocumentSnapshot } from "firebase/firestore";
import { getStartOfTheDay } from "../../utils/dateUtils";
import useAttendanceContext from "../../hooks/useAttendanceContext";

const END_OF_THE_DAY = getStartOfTheDay();

export default function EventsPage() {
  const { showErrorAlert } = useAlertContext();
  const { addAttendance, removeAttendance, isAttendingEvent } =
    useAttendanceContext();

  const [events, setEvents] = useState<EventModel[]>([]);
  const [filter, setFilter] = useState<DateFilterType | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const lastDoc: React.RefObject<
    DocumentSnapshot<DocumentData, DocumentData> | undefined
  > = useRef(undefined);

  const hasMoreEventsToLoad: React.RefObject<boolean | undefined> =
    useRef(undefined);

  useEffect(() => {
    lastDoc.current = undefined;
    hasMoreEventsToLoad.current = undefined;

    const unsubscribe = eventsServices.subscribeToEvents(
      (paginatedResult) => {
        lastDoc.current = paginatedResult.lastDoc;
        hasMoreEventsToLoad.current = paginatedResult.hasMore;

        setEvents(
          paginatedResult.records.sort(
            (a, b) => a.date.getTime() - b.date.getTime()
          )
        );

        setIsLoading(false);
      },
      (err) => {
        showErrorAlert(err);
        setIsLoading(false);
      },
      filter,
      lastDoc.current
    );

    return () => unsubscribe();
  }, [filter, showErrorAlert]);

  const onLoadMoreEventsClickHandler = async () => {
    setIsLoading(true);
    try {
      const paginatedResult = await eventsServices.getEvents(
        filter,
        lastDoc.current
      );

      lastDoc.current = paginatedResult.lastDoc;
      hasMoreEventsToLoad.current = paginatedResult.hasMore;

      setEvents((prev) =>
        [...prev, ...paginatedResult.records].sort(
          (a, b) => a.date.getTime() - b.date.getTime()
        )
      );
    } catch (error) {
      showErrorAlert(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onAttendEventClickHandler = async (eventId: string) => {
    try {
      setIsLoading(true);
      await addAttendance(eventId);
    } catch (error) {
      showErrorAlert(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRemoveEventAttendanceClickHandler = async (eventId: string) => {
    try {
      setIsLoading(true);
      await removeAttendance(eventId);
    } catch (error) {
      showErrorAlert(error);
    } finally {
      setIsLoading(false);
    }
  };

  return isLoading ? (
    "Loading..."
  ) : (
    <>
      <PageHeader title="Events">
        <Select
          className={classes.select_container}
          label={"Filter Events"}
          value={filter ?? ""}
          onChange={(e) =>
            setFilter(
              e.target.value ? (e.target.value as DateFilterType) : undefined
            )
          }
          options={Object.values(DATE_FILTER_TYPES).map((v) => ({
            code: v,
            value: v,
          }))}
        />
      </PageHeader>
      <EventGrid>
        {events.map((e) => {
          const isCurrentUserAttendingEvent = isAttendingEvent(e.id);
          return (
            <EventCard
              key={e.id}
              event={e}
              footer={
                e.date > END_OF_THE_DAY && (
                  <Button
                    onClick={() =>
                      isCurrentUserAttendingEvent
                        ? onRemoveEventAttendanceClickHandler(e.id)
                        : onAttendEventClickHandler(e.id)
                    }
                  >
                    {isCurrentUserAttendingEvent
                      ? "Remove attendance"
                      : "Attend Event"}
                  </Button>
                )
              }
            />
          );
        })}
      </EventGrid>
      {hasMoreEventsToLoad.current && (
        <Button onClick={onLoadMoreEventsClickHandler}>Load more events</Button>
      )}
    </>
  );
}
