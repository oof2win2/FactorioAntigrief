/**
 * Function to check if a date is between two other dates
 * @param date The date to check
 * @param start The start date
 * @param end The end date
 */
const dateIsBetween = (date: Date, start: Date, end: Date): boolean => {
	return date >= start && date <= end
}
export default dateIsBetween
