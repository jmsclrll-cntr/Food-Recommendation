# Diet Plan Storage Architecture

As per your request, the 7-day diet plan is now stored across **7 separate Firestore collections**, one for each day of the week.

## Database Structure

The system saves the plan into the following collections:
- `MondayPlans`
- `TuesdayPlans`
- `WednesdayPlans`
- `ThursdayPlans`
- `FridayPlans`
- `SaturdayPlans`
- `SundayPlans`

### Document Schema
In each collection, a document is created using the **User ID** as the Document ID. This ensures that every user has exactly one active plan per day.

```json
{
  "userId": "user123",
  "day": "Monday",
  "meals": {
    "breakfast": [...],
    "lunch": [...],
    "dinner": [...],
    "dailyTotal": 1950
  },
  "savedAt": "Timestamp"
}
```

## API Endpoints

### 1. Save Weekly Plan
- **URL**: `/api/diets/save-weekly`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "userId": "string",
    "plan": { "Monday": {...}, "Tuesday": {...}, ... }
  }
  ```
- **Behavior**: Uses a Firestore Batch to atomically update all 7 collections.

### 2. Get Daily Plan
- **URL**: `/api/diets/day/:day/:userId`
- **Method**: `GET`
- **Example**: `/api/diets/day/Monday/user123`

## Recommendations (Alternative Pattern)
While storing data in 7 collections works for small scales, a more scalable approach in Firestore is usually:
- **One Collection**: `UserDiets`
- **Documents**: Each document contains the full 7-day object or has a `day` field.

This makes it easier to query the entire week's history for a user in a single request. However, the current implementation follows your request for separate day collections for easier isolation during development.
