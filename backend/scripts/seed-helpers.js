#!/usr/bin/env node
import prisma from '../src/utils/prisma.js';
import { indexHelper, createIndices } from '../src/services/es.client.js';

const HELPERS_DATA = [
  // 1. Cleaning (4 helpers)
  {
    name: "Sunita Devi",
    email: "sunita.cleaning@hirebuddy.local",
    phone: "9811001001",
    city: "Modipuram, Meerut",
    latitude: 29.0688,
    longitude: 77.7126,
    skills: "Home Cleaning, Deep Cleaning, Kitchen Cleaning, Dusting",
    experience: 5,
    hourlyRate: 20000, // ₹200
    averageRating: 4.9,
    totalReviews: 64,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Rajesh Kumar",
    email: "rajesh.cleaner@hirebuddy.local",
    phone: "9811001002",
    city: "Meerut",
    latitude: 28.9845,
    longitude: 77.7064,
    skills: "Office Cleaning, Sofa Cleaning, Carpet Shampooing, Floor Polishing",
    experience: 6,
    hourlyRate: 25000, // ₹250
    averageRating: 4.8,
    totalReviews: 48,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Meena Sharma",
    email: "meena.sharma@hirebuddy.local",
    phone: "9811001003",
    city: "Shastri Nagar, Meerut",
    latitude: 28.9723,
    longitude: 77.7289,
    skills: "Bathroom Cleaning, Kitchen Cleaning, Balcony Wash, Maid Support",
    experience: 3,
    hourlyRate: 18000, // ₹180
    averageRating: 4.7,
    totalReviews: 32,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Pawan Verma",
    email: "pawan.deepclean@hirebuddy.local",
    phone: "9811001004",
    city: "Kankerkhera, Meerut",
    latitude: 29.0210,
    longitude: 77.6830,
    skills: "Deep Cleaning, Move-in Cleaning, Glass Cleaning, Sanitization",
    experience: 4,
    hourlyRate: 28000, // ₹280
    averageRating: 4.6,
    totalReviews: 19,
    isAvailable: false, // tests availability filter
    idVerificationStatus: "PENDING",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=ID+Pending",
  },

  // 2. Repairs (4 helpers)
  {
    name: "Mohammad Imran",
    email: "imran.electric@hirebuddy.local",
    phone: "9811002001",
    city: "Modipuram, Meerut",
    latitude: 29.0688,
    longitude: 77.7126,
    skills: "Electrician, Wiring Repair, Switchboard Fix, Fan Installation",
    experience: 8,
    hourlyRate: 30000, // ₹300
    averageRating: 4.9,
    totalReviews: 87,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Ramesh Chand",
    email: "ramesh.plumber@hirebuddy.local",
    phone: "9811002002",
    city: "Meerut",
    latitude: 28.9845,
    longitude: 77.7064,
    skills: "Plumber, Pipe Leakage, Tap Replacement, Water Tank Cleaning",
    experience: 7,
    hourlyRate: 25000, // ₹250
    averageRating: 4.8,
    totalReviews: 54,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Anil Carpenter",
    email: "anil.woodworks@hirebuddy.local",
    phone: "9811002003",
    city: "Shastri Nagar, Meerut",
    latitude: 28.9723,
    longitude: 77.7289,
    skills: "Carpentry, Door Lock Repair, Hinge Fixing, Cabinet Work",
    experience: 6,
    hourlyRate: 28000, // ₹280
    averageRating: 4.7,
    totalReviews: 41,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Sanjay Prajapati",
    email: "sanjay.appliances@hirebuddy.local",
    phone: "9811002004",
    city: "Modipuram, Meerut",
    latitude: 29.0710,
    longitude: 77.7150,
    skills: "Appliance Repair, Geyser Repair, RO Service, Washing Machine",
    experience: 5,
    hourlyRate: 35000, // ₹350
    averageRating: 4.6,
    totalReviews: 29,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },

  // 3. Furniture Assembly (4 helpers)
  {
    name: "Vikram Chauhan",
    email: "vikram.assembly@hirebuddy.local",
    phone: "9811003001",
    city: "Modipuram, Meerut",
    latitude: 29.0688,
    longitude: 77.7126,
    skills: "Furniture Assembly, IKEA Assembly, Bed Installation, Wardrobe Setup",
    experience: 6,
    hourlyRate: 30000, // ₹300
    averageRating: 4.9,
    totalReviews: 52,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Dharmendra Singh",
    email: "dharmendra.craft@hirebuddy.local",
    phone: "9811003002",
    city: "Meerut",
    latitude: 28.9845,
    longitude: 77.7064,
    skills: "Table Assembly, Office Desk Setup, Bookshelf Mounting, TV Unit",
    experience: 4,
    hourlyRate: 25000, // ₹250
    averageRating: 4.8,
    totalReviews: 38,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Arun Malik",
    email: "arun.malik@hirebuddy.local",
    phone: "9811003003",
    city: "Kankerkhera, Meerut",
    latitude: 29.0210,
    longitude: 77.6830,
    skills: "Furniture Dismantling, Relocation Assembly, Sofa Fitting",
    experience: 3,
    hourlyRate: 22000, // ₹220
    averageRating: 4.7,
    totalReviews: 24,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Gaurav Tomar",
    email: "gaurav.assembly@hirebuddy.local",
    phone: "9811003004",
    city: "Shastri Nagar, Meerut",
    latitude: 28.9723,
    longitude: 77.7289,
    skills: "Curtain Rod Fitting, Wall Shelves, Heavy Furniture Moving",
    experience: 5,
    hourlyRate: 26000, // ₹260
    averageRating: 4.5,
    totalReviews: 18,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },

  // 4. Grocery Shopping (4 helpers)
  {
    name: "Deepak Saini",
    email: "deepak.grocery@hirebuddy.local",
    phone: "9811004001",
    city: "Modipuram, Meerut",
    latitude: 29.0688,
    longitude: 77.7126,
    skills: "Grocery Shopping, Fresh Vegetables, Supermarket Runs, Pharmacy Pickup",
    experience: 4,
    hourlyRate: 15000, // ₹150
    averageRating: 4.9,
    totalReviews: 92,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Kavita Rani",
    email: "kavita.shopper@hirebuddy.local",
    phone: "9811004002",
    city: "Meerut",
    latitude: 28.9845,
    longitude: 77.7064,
    skills: "Daily Essentials, Dairy & Milk Pickup, Local Mandi Shopping, Bulk Groceries",
    experience: 3,
    hourlyRate: 14000, // ₹140
    averageRating: 4.8,
    totalReviews: 61,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Rahul Tyagi",
    email: "rahul.errands@hirebuddy.local",
    phone: "9811004003",
    city: "Kankerkhera, Meerut",
    latitude: 29.0210,
    longitude: 77.6830,
    skills: "Quick Errands, Urgent Grocery, Fruit Selection, Medicine Delivery",
    experience: 2,
    hourlyRate: 16000, // ₹160
    averageRating: 4.7,
    totalReviews: 35,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1520409364224-63400afe26e5?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Pooja Verma",
    email: "pooja.shopper@hirebuddy.local",
    phone: "9811004004",
    city: "Shastri Nagar, Meerut",
    latitude: 28.9723,
    longitude: 77.7289,
    skills: "Specialty Spices, Organic Food Sourcing, Ration Delivery",
    experience: 4,
    hourlyRate: 17000, // ₹170
    averageRating: 4.8,
    totalReviews: 44,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },

  // 5. Elder Care (4 helpers)
  {
    name: "Dr. Ritu Saxena (Caregiver)",
    email: "ritu.eldercare@hirebuddy.local",
    phone: "9811005001",
    city: "Modipuram, Meerut",
    latitude: 29.0688,
    longitude: 77.7126,
    skills: "Elder Care, Doctor Escort, Medicine Scheduling, Mobility Assistance",
    experience: 7,
    hourlyRate: 35000, // ₹350
    averageRating: 5.0,
    totalReviews: 73,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Suresh Chandra",
    email: "suresh.elder@hirebuddy.local",
    phone: "9811005002",
    city: "Meerut",
    latitude: 28.9845,
    longitude: 77.7064,
    skills: "Companionship, Evening Walk Escort, Hospital Visit Support, Wheelchair Assistance",
    experience: 5,
    hourlyRate: 25000, // ₹250
    averageRating: 4.8,
    totalReviews: 39,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Manju Rani",
    email: "manju.care@hirebuddy.local",
    phone: "9811005003",
    city: "Shastri Nagar, Meerut",
    latitude: 28.9723,
    longitude: 77.7289,
    skills: "Senior Home Support, Light Meals, Vital Signs Checking, Emotional Care",
    experience: 6,
    hourlyRate: 30000, // ₹300
    averageRating: 4.9,
    totalReviews: 51,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Kamal Kishor",
    email: "kamal.caregiver@hirebuddy.local",
    phone: "9811005004",
    city: "Modipuram, Meerut",
    latitude: 29.0700,
    longitude: 77.7140,
    skills: "Physiotherapy Support, Clinic Visits, Overnight Assistance",
    experience: 4,
    hourlyRate: 32000, // ₹320
    averageRating: 4.7,
    totalReviews: 27,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },

  // 6. Delivery (4 helpers)
  {
    name: "Aman Sharma",
    email: "aman.express@hirebuddy.local",
    phone: "9811006001",
    city: "Modipuram, Meerut",
    latitude: 29.0688,
    longitude: 77.7126,
    skills: "Express Courier, Parcel Pickup, Document Drop, Urgent Medicine",
    experience: 3,
    hourlyRate: 15000, // ₹150
    averageRating: 4.9,
    totalReviews: 110,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Sonu Yadav",
    email: "sonu.delivery@hirebuddy.local",
    phone: "9811006002",
    city: "Meerut",
    latitude: 28.9845,
    longitude: 77.7064,
    skills: "Bike Delivery, Tiffin Delivery, Package Transfer, Inter-city Courier",
    experience: 4,
    hourlyRate: 16000, // ₹160
    averageRating: 4.8,
    totalReviews: 85,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Mohit Kashyap",
    email: "mohit.runner@hirebuddy.local",
    phone: "9811006003",
    city: "Kankerkhera, Meerut",
    latitude: 29.0210,
    longitude: 77.6830,
    skills: "Heavy Box Delivery, Food Pickup, Stationery Drop, Laundry Run",
    experience: 2,
    hourlyRate: 14000, // ₹140
    averageRating: 4.7,
    totalReviews: 42,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Nitin Bhati",
    email: "nitin.express@hirebuddy.local",
    phone: "9811006004",
    city: "Shastri Nagar, Meerut",
    latitude: 28.9723,
    longitude: 77.7289,
    skills: "Fragile Delivery, Gift Handover, Cheque Deposit, Cake Delivery",
    experience: 5,
    hourlyRate: 18000, // ₹180
    averageRating: 4.9,
    totalReviews: 68,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },

  // 7. Driver (4 helpers)
  {
    name: "Ravinder Gurjar",
    email: "ravinder.driver@hirebuddy.local",
    phone: "9811007001",
    city: "Modipuram, Meerut",
    latitude: 29.0688,
    longitude: 77.7126,
    skills: "Personal Driver, Manual & Automatic, Highway Driving, Airport Drop",
    experience: 10,
    hourlyRate: 35000, // ₹350
    averageRating: 4.9,
    totalReviews: 124,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Commercial+License+Verified",
  },
  {
    name: "Harish Rawat",
    email: "harish.pilot@hirebuddy.local",
    phone: "9811007002",
    city: "Meerut",
    latitude: 28.9845,
    longitude: 77.7064,
    skills: "City Chauffeur, Outstation Trips, Luxury Cars, Night Driving",
    experience: 8,
    hourlyRate: 40000, // ₹400
    averageRating: 4.8,
    totalReviews: 76,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=License+Verified",
  },
  {
    name: "Mukesh Pal",
    email: "mukesh.driver@hirebuddy.local",
    phone: "9811007003",
    city: "Kankerkhera, Meerut",
    latitude: 29.0210,
    longitude: 77.6830,
    skills: "Daily Office Commute, School Pickup Driver, Family Car Driver",
    experience: 6,
    hourlyRate: 30000, // ₹300
    averageRating: 4.7,
    totalReviews: 53,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=License+Verified",
  },
  {
    name: "Satender Kumar",
    email: "satender.wheels@hirebuddy.local",
    phone: "9811007004",
    city: "Shastri Nagar, Meerut",
    latitude: 28.9723,
    longitude: 77.7289,
    skills: "SUV Driver, Wedding Chauffeur, Hill Station Driving, Valet",
    experience: 9,
    hourlyRate: 45000, // ₹450
    averageRating: 4.9,
    totalReviews: 95,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=License+Verified",
  },

  // 8. Home Support (4 helpers)
  {
    name: "Shanti Devi",
    email: "shanti.home@hirebuddy.local",
    phone: "9811008001",
    city: "Modipuram, Meerut",
    latitude: 29.0688,
    longitude: 77.7126,
    skills: "Home Cooking, Roti Making, Dishwashing, Kitchen Organizing",
    experience: 8,
    hourlyRate: 22000, // ₹220
    averageRating: 4.9,
    totalReviews: 88,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Babita Rani",
    email: "babita.maid@hirebuddy.local",
    phone: "9811008002",
    city: "Meerut",
    latitude: 28.9845,
    longitude: 77.7064,
    skills: "Clothes Ironing, Wardrobe Organization, Laundry Folding, Plant Care",
    experience: 5,
    hourlyRate: 18000, // ₹180
    averageRating: 4.8,
    totalReviews: 67,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Guddi Devi",
    email: "guddi.helper@hirebuddy.local",
    phone: "9811008003",
    city: "Shastri Nagar, Meerut",
    latitude: 28.9723,
    longitude: 77.7289,
    skills: "Child Day Support, Storytelling, Meal Prep, School Bag Readying",
    experience: 6,
    hourlyRate: 25000, // ₹250
    averageRating: 4.9,
    totalReviews: 49,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
  {
    name: "Rekha Kashyap",
    email: "rekha.support@hirebuddy.local",
    phone: "9811008004",
    city: "Kankerkhera, Meerut",
    latitude: 29.0210,
    longitude: 77.6830,
    skills: "House Sitting, Pet Feeding, Terrace Cleaning, Grocery Storage",
    experience: 4,
    hourlyRate: 20000, // ₹200
    averageRating: 4.7,
    totalReviews: 31,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    image: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=256&h=256&q=80",
    idDocumentUrl: "https://placehold.co/600x400?text=Govt+ID+Verified",
  },
];

async function seed() {
  console.log('--- Initializing Helper Seeding (32 helpers across 8 categories) ---');
  
  try {
    // Check/create ES indices
    try {
      await createIndices();
      console.log('✓ Elasticsearch indices verified');
    } catch (esErr) {
      console.warn('! Elasticsearch check skipped/warn:', esErr?.message || esErr);
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const helperData of HELPERS_DATA) {
      // Upsert by phone to prevent duplicates
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: helperData.phone },
            { email: helperData.email },
          ],
        },
      });

      let user;
      if (existing) {
        user = await prisma.user.update({
          where: { id: existing.id },
          data: {
            role: "HELPER",
            name: helperData.name,
            city: helperData.city,
            latitude: helperData.latitude,
            longitude: helperData.longitude,
            skills: helperData.skills,
            experience: helperData.experience,
            hourlyRate: helperData.hourlyRate,
            averageRating: helperData.averageRating,
            totalReviews: helperData.totalReviews,
            isAvailable: helperData.isAvailable,
            idVerificationStatus: helperData.idVerificationStatus,
            image: helperData.image,
            idDocumentUrl: helperData.idDocumentUrl,
          },
        });
        updatedCount++;
      } else {
        user = await prisma.user.create({
          data: {
            role: "HELPER",
            email: helperData.email,
            phone: helperData.phone,
            name: helperData.name,
            city: helperData.city,
            latitude: helperData.latitude,
            longitude: helperData.longitude,
            skills: helperData.skills,
            experience: helperData.experience,
            hourlyRate: helperData.hourlyRate,
            averageRating: helperData.averageRating,
            totalReviews: helperData.totalReviews,
            isAvailable: helperData.isAvailable,
            idVerificationStatus: helperData.idVerificationStatus,
            image: helperData.image,
            idDocumentUrl: helperData.idDocumentUrl,
          },
        });
        createdCount++;
      }

      // Index into Elasticsearch
      try {
        await indexHelper(user);
      } catch (err) {
        console.warn(`! Failed to index ${user.name} in ES:`, err?.message);
      }
    }

    console.log(`\n✅ Seeding complete! Created: ${createdCount}, Updated: ${updatedCount}, Total: ${HELPERS_DATA.length}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seed();
