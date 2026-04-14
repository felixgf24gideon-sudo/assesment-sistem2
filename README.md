# Project Name: assesment-sistem2

## Description
This repository contains the source code for the assesment-sistem2 application. The application utilizes the React framework, providing a comprehensive assessment experience for users.

## State Management
The application manages its state using the React Context API, allowing for global state management across components without the need for additional libraries such as useReducer.

## Components
The following components are included in the project:
- **FeedbackPanel**: Displays user feedback and assessments.
- **LoadingSpinner**: Indicates loading states in the application.
- **ProfileSelector**: Allows users to select their profile.
- **ProgressIndicator**: Shows the progress of the assessment.
- **QuestionCard**: Responsible for displaying individual questions.

## Services
The following services can be found in the `server/src/services/` directory:
- **aiService.ts**: Handles AI-related functionalities.
- **promptBuilder.ts**: Constructs prompts for AI processing.

## Middleware
The following middleware functions are implemented:
- **validateRequest**: Validates incoming requests to ensure they meet the required criteria.
- **errorHandler**: Catches and handles errors in the application.

## Controllers
The project includes the following controller:
- **feedbackController.ts**: Manages the logic related to feedback submission and retrieval.

## Shared Files
The shared folder contains:
- **types.ts**: Type definitions used throughout the application.
- **questions.ts**: Contains the questions used in the assessment.

## Questions
The application features a set of 20 questions, each covering a specific topic. Details about the topics and question content can be found in `shared/questions.ts`.

## API Endpoint Documentation
Make sure to review the API endpoint documentation for the actual request/response structure used in the application.

## Installation Instructions
To set up the application, ensure to configure the `.env` file according to your development environment settings.

## Project Structure
The project is organized as follows:

```
assesment-sistem2/
|-- client/
|   |-- src/
|   |   |-- components/
|   |   |   |-- FeedbackPanel/
|   |   |   |-- LoadingSpinner/
|   |   |   |-- ProfileSelector/
|   |   |   |-- ProgressIndicator/
|   |   |   |-- QuestionCard/
|   |
|-- server/
|   |-- src/
|       |-- controllers/
|       |   |-- feedbackController.ts
|       |-- middleware/
|       |   |-- validateRequest.ts
|       |   |-- errorHandler.ts
|       |-- services/
|       |   |-- aiService.ts
|       |   |-- promptBuilder.ts
|       |-- shared/
|           |-- types.ts
|           |-- questions.ts
``` 

## Additional Notes
All features listed that are not currently implemented have been removed to reflect the actual capabilities of the project.