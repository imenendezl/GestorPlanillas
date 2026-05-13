import type { ShiftCode, SwapRequest, UserProfile } from "@/types/domain";

export type CalendarSwapAnnotation = {
  id: string;
  date: string;
  direction: "coveredByOther" | "coveredByMe";
  personName: string;
  shiftCodes: ShiftCode[];
  relatedDate: string | null;
  relatedShiftCodes: ShiftCode[];
  exchangeKind: "dayExchange" | "openChange";
  label: string;
  detail: string;
};

function firstName(name?: string) {
  return name?.split(/\s+/).filter(Boolean)[0] ?? "Compañero/a";
}

function pushIfDate(annotations: CalendarSwapAnnotation[], annotation: CalendarSwapAnnotation | null) {
  if (annotation) {
    annotations.push(annotation);
  }
}

export function getCalendarSwapAnnotations(profile: Pick<UserProfile, "id">, requests: SwapRequest[]) {
  return requests.flatMap((request) => {
    if (request.status !== "Accepted" || !request.acceptedBy || !request.requestedDate) {
      return [];
    }

    const annotations: CalendarSwapAnnotation[] = [];
    const isRequester = request.requesterId === profile.id;
    const isAccepter = request.acceptedBy === profile.id;

    if (!isRequester && !isAccepter) {
      return [];
    }

    const requesterName = firstName(request.requesterName);
    const accepterName = firstName(request.accepterName);

    pushIfDate(
      annotations,
      isRequester
        ? {
            id: `${request.id}:requested:other`,
            date: request.requestedDate,
            direction: "coveredByOther",
            personName: accepterName,
            shiftCodes: request.requestedShiftCodes,
            relatedDate: request.mode === "Exchange" ? request.acceptedDate : null,
            relatedShiftCodes: request.accepterPreviousShiftCodes,
            exchangeKind: request.mode === "Exchange" && request.acceptedDate ? "dayExchange" : "openChange",
            label: `${accepterName} te lo hace`,
            detail: `${accepterName} hace tu turno.`
          }
        : {
            id: `${request.id}:requested:me`,
            date: request.requestedDate,
            direction: "coveredByMe",
            personName: requesterName,
            shiftCodes: request.requestedShiftCodes,
            relatedDate: request.mode === "Exchange" ? request.acceptedDate : null,
            relatedShiftCodes: request.accepterPreviousShiftCodes,
            exchangeKind: request.mode === "Exchange" && request.acceptedDate ? "dayExchange" : "openChange",
            label: `Haces a ${requesterName}`,
            detail: `Tú haces el turno de ${requesterName}.`
          }
    );

    if (request.mode === "Exchange" && request.acceptedDate) {
      pushIfDate(
        annotations,
        isRequester
          ? {
              id: `${request.id}:accepted:me`,
              date: request.acceptedDate,
              direction: "coveredByMe",
              personName: accepterName,
              shiftCodes: request.accepterPreviousShiftCodes,
              relatedDate: request.requestedDate,
              relatedShiftCodes: request.requestedShiftCodes,
              exchangeKind: "dayExchange",
              label: `Haces a ${accepterName}`,
              detail: `Tú haces el turno de ${accepterName}.`
            }
          : {
              id: `${request.id}:accepted:other`,
              date: request.acceptedDate,
              direction: "coveredByOther",
              personName: requesterName,
              shiftCodes: request.accepterPreviousShiftCodes,
              relatedDate: request.requestedDate,
              relatedShiftCodes: request.requestedShiftCodes,
              exchangeKind: "dayExchange",
              label: `${requesterName} te lo hace`,
              detail: `${requesterName} hace tu turno ese día.`
            }
      );
    }

    return annotations;
  });
}

export function groupCalendarSwapAnnotationsByDate(annotations: CalendarSwapAnnotation[]) {
  return annotations.reduce((grouped, annotation) => {
    const current = grouped.get(annotation.date) ?? [];
    current.push(annotation);
    grouped.set(annotation.date, current);
    return grouped;
  }, new Map<string, CalendarSwapAnnotation[]>());
}
