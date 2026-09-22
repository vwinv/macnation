const monthNamesFr = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

const weekdayShortFr = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

String formatFcfa(int amount) {
  final digits = amount.toString();
  final buffer = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    if (i != 0 && (digits.length - i) % 3 == 0) buffer.write(' ');
    buffer.write(digits[i]);
  }
  return '$buffer F';
}

String formatDateLong(DateTime date) {
  return '${date.day} ${monthNamesFr[date.month - 1]} ${date.year}';
}

String formatDateShort(DateTime date) {
  final month = monthNamesFr[date.month - 1];
  return '${date.day} ${month.length <= 4 ? month : '${month.substring(0, 3)}.'}';
}

String salonOpenLabel([DateTime? now]) {
  final date = now ?? DateTime.now();
  final sunday = date.weekday == DateTime.sunday;
  final openHour = sunday ? 12 : 10;
  final closeHour = sunday ? 20 : 21;
  if (date.hour < openHour) return 'Ouvre à ${openHour}h';
  if (date.hour >= closeHour) return 'Fermé · ouvre demain';
  return 'Ouvert · jusqu’à ${closeHour}h';
}
