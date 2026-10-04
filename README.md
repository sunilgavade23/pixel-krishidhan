# 🌾 KrishiDhan
## Location-Based Agricultural Equipment Rental Platform

### Live Demo

https://pixel-krishidhan.vercel.app/

---

# Overview

KrishiDhan is a location-based agricultural equipment rental platform designed to help small and marginal farmers easily find and rent agricultural machinery from nearby equipment owners.

Small farmers often cannot afford to purchase expensive machinery such as tractors, cultivators, rotavators, harvesters and trolleys. At the same time, many equipment owners have machinery that remains unused for significant periods.

KrishiDhan connects these two sides through a simple digital marketplace.

The platform allows:

- Farmers to discover nearby agricultural equipment
- Equipment owners to list their machinery
- Farmers to check equipment availability
- Farmers to send rental requests
- Equipment owners to accept or reject requests
- Farmers and owners to manage their listings and bookings

A key feature of KrishiDhan is its location-based discovery system, which prioritizes equipment available within a practical geographic radius of the farmer.

---

# Problem

Small and marginal farmers often depend on rented agricultural machinery for timely farming operations.

However, finding the right machine at the right time remains difficult because the agricultural equipment rental market is often fragmented and dependent on manual coordination.

Common challenges include:

- Limited access to expensive agricultural machinery
- High cost of purchasing tractors and implements
- Difficulty finding nearby equipment during peak farming seasons
- Dependence on phone calls and personal contacts
- Lack of centralized information about equipment availability
- Equipment owners having machinery remain idle when there is no demand
- Difficulty coordinating rental requests and availability

This creates an information and accessibility gap between farmers who need machinery and owners who have machinery available.

---

# Solution

KrishiDhan provides a centralized digital platform connecting farmers and agricultural equipment owners.

The platform allows equipment owners to list their machinery with details such as:

- Equipment type
- Equipment name
- Images
- Pricing
- Availability
- Location

Farmers can then discover suitable machinery near their current location, view equipment details, check availability and send rental requests.

This creates a more organized and transparent equipment rental workflow.

---

# How It Works

Farmer

↓

Login / Registration

↓

Current Location Detection

↓

Nearby Equipment Discovery

↓

View Equipment Details

↓

Check Availability

↓

Send Rental Request

↓

Owner Reviews Request

↓

Accept / Reject

↓

Booking Status Updated

---

Equipment Owner

↓

Login / Registration

↓

Post Equipment

↓

Add Equipment Details

↓

Set Price & Availability

↓

Location Saved

↓

Receive Rental Requests

↓

Accept / Reject Request

↓

Manage Equipment

---

# Core Features

## 🚜 Agricultural Equipment Marketplace

Equipment owners can list agricultural machinery on the platform.

Supported equipment can include:

- Tractors
- Cultivators
- Rotavators
- Harvesters
- Trolleys
- Other agricultural implements

Each listing can contain equipment details, pricing, availability and images.

---

## 👨🌾 Farmer Dashboard

Farmers get a dedicated interface to:

- Browse agricultural equipment
- View nearby machinery
- View equipment details
- Check availability
- Send rental requests
- Track booking requests
- Manage their profile

---

## 🚜 Equipment Owner Dashboard

Equipment owners can:

- Add new equipment
- Upload equipment images
- Set rental pricing
- Update availability
- Manage their listings
- View rental requests
- Accept or reject requests

---

# 📍 Location-Based Equipment Discovery

One of the core features of KrishiDhan is location-based equipment discovery.

When an equipment owner lists machinery, the equipment's geographic coordinates are stored with the listing.

When a farmer accesses the marketplace, the application detects the farmer's current location.

The system then calculates the geographical distance between the farmer and available equipment.

Only equipment within a **10 KM radius** is displayed to the farmer.

This helps farmers discover practically accessible machinery instead of searching through equipment located far away.

---

# 📐 Distance Calculation

KrishiDhan uses geographical distance calculation to determine whether equipment is within the required radius.

The distance between the farmer and equipment coordinates is calculated using the **Haversine formula**.

Conceptually:

Farmer Latitude + Longitude

↓

Equipment Latitude + Longitude

↓

Distance Calculation

↓

Distance ≤ 10 KM

↓

Display Equipment

This provides a location-aware equipment discovery experience.

---

# 📍 Automatic Location Detection

The application uses browser-based geolocation to obtain the user's current coordinates.

The location system can be used to determine:

- Latitude
- Longitude
- Nearby equipment
- Village / locality information where supported

This information is used to provide a more localized experience.

---

# 🔐 Authentication

KrishiDhan uses Firebase Authentication for secure user authentication.

Supported authentication methods include:

- Email & Password
- Google Sign-In
- Phone Number / OTP

Phone OTP authentication is designed to provide a simpler login experience for users who prefer using their mobile number.

Firebase's authentication security mechanisms, including reCAPTCHA protection for phone authentication, are used to reduce abuse and fraudulent requests.

---

# 👤 Role-Based Access

KrishiDhan provides different experiences based on the user's role.

## Farmer

Farmers can:

- Discover equipment
- View listings
- Check availability
- Send rental requests
- Track bookings

## Equipment Owner

Equipment owners can:

- Post equipment
- Manage listings
- Update availability
- Receive requests
- Accept or reject requests

Role-based access helps keep farmer and owner workflows separate and easier to manage.

---

# 📦 Equipment Listing

Equipment owners can create listings by providing relevant information such as:

- Equipment name
- Equipment category
- Description
- Rental price
- Availability
- Images
- Location

The listing is then stored in Firebase Firestore.

---

# 📅 Availability Management

Equipment owners can manage whether their machinery is available for rental.

Farmers can use availability information before sending a rental request.

This helps reduce unnecessary requests and improves coordination between farmers and equipment owners.

---

# 📝 Rental Request System

Farmers can send rental requests for available equipment.

The equipment owner can then:

- Accept the request
- Reject the request
- Review request details
- Manage incoming requests

The corresponding booking/request status is updated in the system.

---

# ☁ Image Upload

Equipment images are stored using **Cloudinary**.

This allows equipment owners to upload and display machinery images without storing large image files directly inside Firestore.

---

# 🔥 Firebase Integration

Firebase is used as the core backend service.

### Firebase Authentication

Used for:

- User registration
- User login
- Google authentication
- Phone OTP authentication
- Session management

### Firebase Firestore

Used for storing application data such as:

- Users
- Equipment listings
- Rental requests
- Booking information
- Availability information

---

# Technical Architecture

## Frontend

- React.js
- Vite
- JavaScript
- Tailwind CSS
- Lucide React

## Authentication

- Firebase Authentication
- Email & Password
- Google Sign-In
- Phone Authentication

## Backend / Database

- Firebase Firestore
- Firebase Authentication

## Image Storage

- Cloudinary

## Location

- Browser Geolocation API
- Latitude & Longitude
- Haversine distance calculation
- Location-based filtering

## Deployment

- Vercel

---

# System Architecture

User

↓

React + Vite Frontend

↓

Firebase Authentication

↓

Role-Based Application Flow

↓

Farmer / Equipment Owner

↓

Firebase Firestore

↓

Listings / Requests / Users / Availability

↓

Cloudinary

↓

Equipment Images

---

# Data Flow

### Equipment Listing Flow

Equipment Owner

↓

Post Equipment

↓

Capture Location

↓

Upload Image

↓

Save Equipment Data

↓

Firestore

---

### Farmer Discovery Flow

Farmer

↓

Get Current Location

↓

Fetch Nearby Equipment

↓

Calculate Distance

↓

Apply 10 KM Filter

↓

Display Available Equipment

---

### Rental Flow

Farmer

↓

Select Equipment

↓

Check Availability

↓

Send Request

↓

Firestore

↓

Equipment Owner

↓

Accept / Reject

↓

Booking Status

---

# Design Decisions

## 📍 Strict 10 KM Radius

The 10 KM radius was chosen to make equipment discovery more practical for farmers.

Agricultural machinery such as tractors and harvesters involve transportation and operating costs, so showing extremely distant equipment may not be useful.

---

## 📱 Farmer-Friendly Authentication

Phone number authentication is supported to provide a simpler authentication option for farmers who may prefer mobile numbers over email.

Google and Email/Password authentication are also supported for flexibility.

---

## ☁ Cloudinary for Images

Equipment photographs can consume significant storage space.

Cloudinary is used for image storage and delivery while Firebase Firestore stores the corresponding equipment information.

---

## 🔥 Firebase-Based Architecture

Firebase provides authentication and cloud database capabilities without requiring a separately managed traditional server for the prototype.

This allows the application to be developed and deployed quickly while maintaining a scalable architecture for future expansion.

---

# Project Structure

```text
pixel-krishidhan/
│
├── public/
│
├── scripts/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── data/
│   └── utils/
│
├── .gitignore
├── package.json
├── package-lock.json
├── vite.config.js
├── tailwind.config.js
├── vercel.json
└── README.md
```

---
# Author
Developed by **Sunil**
