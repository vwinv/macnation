enum PaymentMethod { wave, orangeMoney, freeMoney, salon }

enum LocationType { salon, home }

enum PaymentTiming { now, atSalon }

class ServiceItem {
  const ServiceItem({
    required this.id,
    required this.name,
    required this.description,
    required this.duration,
    required this.category,
    required this.image,
    this.price,
    this.priceLabel,
  });

  final String id;
  final String name;
  final String description;
  final String duration;
  final String category;
  final String image;
  final int? price;
  final String? priceLabel;

  String get displayPrice => priceLabel ?? (price != null ? '$price' : '—');

  bool get isQuoted {
    if (price == null) return true;
    return RegExp(r'sur\s*devis', caseSensitive: false).hasMatch(priceLabel ?? '');
  }
}

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.price,
    required this.image,
  });

  final String id;
  final String name;
  final String category;
  final String description;
  final int price;
  final String image;
}

class MembershipPlan {
  const MembershipPlan({
    required this.id,
    required this.name,
    required this.price,
    required this.perks,
    this.featured = false,
  });

  final String id;
  final String name;
  final int price;
  final List<String> perks;
  final bool featured;
}

class Article {
  const Article({
    required this.id,
    required this.title,
    required this.category,
    required this.date,
    required this.excerpt,
    required this.body,
    required this.image,
  });

  final String id;
  final String title;
  final String category;
  final DateTime date;
  final String excerpt;
  final String body;
  final String image;
}

class Review {
  const Review({
    required this.author,
    required this.quote,
    this.rating = '5/5',
    this.city = 'Nord Foire, Dakar',
  });

  final String author;
  final String quote;
  final String rating;
  final String city;
}

class SalonInfo {
  const SalonInfo({
    required this.name,
    required this.address,
    required this.hours,
    required this.phone,
  });

  final String name;
  final String address;
  final String hours;
  final String phone;
}

class TimeSlot {
  const TimeSlot({
    required this.time,
    required this.available,
    this.end,
    this.label,
  });

  final String time;
  final bool available;
  final String? end;
  final String? label;

  String get display => (label != null && label!.isNotEmpty) ? label! : time;
}

class OpeningHour {
  const OpeningHour({
    required this.weekday,
    required this.closed,
    required this.openTime,
    required this.closeTime,
  });

  final int weekday;
  final bool closed;
  final String openTime;
  final String closeTime;
}

class SalonSchedule {
  const SalonSchedule({
    this.hours = const [],
    this.closedDates = const [],
  });

  final List<OpeningHour> hours;
  final List<String> closedDates;

  bool isClosed(DateTime date) {
    final iso =
        '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    if (closedDates.contains(iso)) return true;
    final weekday = date.weekday % 7;
    for (final hour in hours) {
      if (hour.weekday == weekday) return hour.closed;
    }
    return false;
  }
}

class UserProfile {
  const UserProfile({
    required this.name,
    required this.phone,
    this.email,
    this.points = 0,
    this.creditFcfa = 0,
    this.planName,
    this.redeemPoints = 10,
    this.redeemFcfa = 1000,
  });

  final String name;
  final String phone;
  final String? email;
  final int points;
  final int creditFcfa;
  final String? planName;
  final int redeemPoints;
  final int redeemFcfa;

  bool get canRedeem => points >= redeemPoints;
}

class Appointment {
  const Appointment({
    required this.id,
    required this.serviceName,
    required this.date,
    required this.time,
    required this.location,
    required this.total,
    required this.paid,
    this.invoiceId,
    this.paymentMethod,
  });

  final String id;
  final String serviceName;
  final DateTime date;
  final String time;
  final LocationType location;
  final int total;
  final bool paid;
  final String? invoiceId;
  final String? paymentMethod;

  bool get waitingQuote => !paid && total <= 0;
  bool get quoteReady => !paid && total > 0;
  bool get salonChosen => quoteReady && paymentMethod == 'especes';
}

class BookingDraft {
  PaymentTiming paymentTiming = PaymentTiming.now;
  LocationType location = LocationType.salon;
  ServiceItem? service;
  DateTime? date;
  String? time;
  String name = '';
  String phone = '';
  String email = '';
  String address = '';
  PaymentMethod paymentMethod = PaymentMethod.wave;

  int get servicePrice => service?.price ?? 0;

  int get travelFee => location == LocationType.home ? 2000 : 0;

  int get total => (service?.isQuoted ?? false) ? 0 : servicePrice + travelFee;

  bool get isComplete =>
      service != null &&
      date != null &&
      time != null &&
      name.trim().isNotEmpty &&
      phone.trim().isNotEmpty &&
      (location != LocationType.home || address.trim().isNotEmpty);
}
