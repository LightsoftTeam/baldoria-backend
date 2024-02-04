import { ErrorApp } from "src/common/interfaces/error-app.interface";

export enum UseReservationError {
    ALREADY_USED = 'ALREADY_USED',
    DATE_NOT_VALID = 'DATE_NOT_VALID',
}

export const useReservationErrors: {
    [key in UseReservationError]: ErrorApp;
} = {
    [UseReservationError.ALREADY_USED]: {
        message: 'Reservation already used',
        error: UseReservationError.ALREADY_USED,
    },
    [UseReservationError.DATE_NOT_VALID]: {
        message: 'Date is in the past',
        error: UseReservationError.DATE_NOT_VALID,
    },
}