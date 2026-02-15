# TASKRABBIT LITE

A cross-platform mobile application for connecting service providers with customers, built with React Native and Firebase.

## Features

- **Cross-Platform**: Single codebase for iOS and Android using React Native
- **Real-Time Updates**: Instant task status updates using Firestore listeners
- **Secure Authentication**: Firebase Auth with email/password
- **Task Management**: Create, bid on, assign, and complete tasks
- **Bidding System**: Providers can bid on customer tasks
- **Real-Time Messaging**: Chat between customers and providers
- **Streamlined UI**: Clean, intuitive mobile experience

## Tech Stack

- **Framework**: React Native with Expo
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Navigation**: React Navigation v6
- **State Management**: React Context API
- **Icons**: React Native Vector Icons

## Project Structure

```
taskrabbit-lite/
├── App.js
├── package.json
└── src/
    ├── components/
    │   └── TaskCard.js
    ├── context/
    │   └── AuthContext.js
    ├── hooks/
    │   └── useTasks.js
    ├── navigation/
    │   └── RootNavigator.js
    ├── screens/
    │   ├── HomeScreen.js
    │   ├── LoginScreen.js
    │   └── ...
    └── services/
        ├── firebase.js
        ├── authService.js
        └── taskService.js
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Firebase project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Firebase:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Enable Cloud Firestore
   - Enable Storage

3. Configure environment variables:
```bash
# Create .env file
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

4. Start the development server:
```bash
npm start
# or
expo start
```

5. Run on device/simulator:
```bash
# iOS
npm run ios

# Android
npm run android
```

## Firebase Data Structure

### Collections

#### `users`
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  phone: string,
  role: 'customer' | 'provider',
  avatar: string | null,
  location: GeoPoint | null,
  rating: number,
  totalReviews: number,
  isAvailable: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `tasks`
```javascript
{
  customerId: string,
  providerId: string | null,
  title: string,
  description: string,
  category: string,
  budget: number,
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled',
  location: { address: string, coordinates: GeoPoint },
  bidsCount: number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `bids`
```javascript
{
  taskId: string,
  providerId: string,
  amount: number,
  message: string,
  estimatedTime: string,
  status: 'pending' | 'accepted' | 'rejected',
  createdAt: Timestamp
}
```

## Key Features Implementation

### Real-Time Task Updates
Tasks use Firestore's `onSnapshot` listener for instant updates:
```javascript
const unsubscribe = taskService.subscribeToTasks(
  (tasks) => setTasks(tasks),
  { status: 'open' }
);
```

### Secure Authentication
Firebase Auth handles secure user management:
```javascript
await auth().signInWithEmailAndPassword(email, password);
```

### Bidding System
Atomic operations ensure data consistency:
```javascript
const batch = firestore().batch();
batch.set(bidRef, bidData);
batch.update(taskRef, { bidsCount: increment(1) });
await batch.commit();
```

## Screens

- **Login/Register**: User authentication
- **Home**: Task feed with categories
- **Tasks**: User's tasks (customer) or jobs (provider)
- **Task Detail**: Task information and bidding
- **Create Task**: Post new task (customer only)
- **Messages**: Chat with providers/customers
- **Profile**: User profile management

## License

MIT License
