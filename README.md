# AI Interview Coach

Simulates a real interview environment by combining body language tracking (eye contact, posture, and hand movements) with an evaluation of answer quality based on audio transcription. It guides the user through the interview process and provides a final evaluation.

## Demo

Check out the demo video on YouTube:
[![AI Interview Coach Demo](https://img.youtube.com/vi/GokPYYGrF5g/0.jpg)](https://www.youtube.com/watch?v=GokPYYGrF5g)

## Technologies Used

- **Next.js** 
- **Screenpipe** 
- **OpenAI** 
- **Deepgram**
- **MediaPipe**

## Features

- **Real-Time Interaction:** Captures and processes user audio with Screenpipe and OpenAI, enabling a dynamic conversation simulation.
- **Body Language Analysis:** Monitors eye movement, hand gestures, and posture using MediaPipe to provide detailed feedback on body language.
- **Performance Metrics:** Generates comprehensive reports highlighting strengths and areas for improvement, helping users refine their interview techniques.
- **Immersive Interview Simulation:** Creates a realistic, interactive environment that mimics live interview scenarios, perfect for job seekers and professionals looking to enhance their presentation skills.

## Getting Started

### Prerequisites

- Screenpipe Installed
- OpenAI api key in Screenpipe

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/betterview.git
   ```
2. **Install dependencies:**
    ```bash
    bun install
    ```
3. **Run Development Server:**
    ```bash
    npm run dev
    ```
Open http://localhost:3000 in your browser to view the application.