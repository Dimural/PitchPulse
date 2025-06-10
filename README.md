# PitchPulse - AI-Powered Presentation Practice Tool

PitchPulse is an interactive web application that helps users practice and improve their presentation skills using AI-powered feedback. The tool tracks eye contact, speaking pace, and provides real-time feedback to enhance presentation confidence.

## Features

- **Real-time Eye Contact Tracking**: Monitors and provides feedback on eye contact percentage during practice sessions
- **Speaking Pace Analysis**: Tracks words per minute and provides feedback on speaking speed
- **Confidence Scoring**: Calculates an overall confidence score based on eye contact and speaking metrics
- **Multiple Difficulty Levels**: Choose from Beginner, Intermediate, and Advanced practice sessions
- **Interactive Feedback**: Real-time visual feedback on performance metrics
- **Session Scoring**: End-of-session scoring system (0-100) based on:
  - Eye contact percentage
  - Speaking pace
  - Overall confidence
  - Session completion

## Technical Stack

- React + TypeScript
- Vite
- Tailwind CSS + DaisyUI
- TensorFlow.js (for face detection)
- Web Speech API (for speech recognition)
- WebRTC (for camera access)

## Prerequisites

- Node.js (v16 or higher)
- Modern web browser with camera access
- WebRTC support
- Web Speech API support

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Dimural/PitchPulse.git
cd PitchPulse
```

2. Install dependencies:
```bash
npm install
```

3. Download required AI models:
```bash
npm run download-models
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to the URL shown in your terminal (typically `http://localhost:3000` or higher)

## Usage

1. Select a difficulty level (Beginner, Intermediate, or Advanced)
2. Click "Start Session" to begin
3. Speak naturally while maintaining eye contact with the camera
4. View real-time feedback on your performance
5. End the session to see your final score and detailed feedback

## Performance Metrics

- **Eye Contact**: Percentage of time maintaining eye contact with the camera
- **Speaking Pace**: Words per minute (WPM) calculation
- **Confidence Score**: Combined metric based on eye contact and speaking pace
- **Final Score**: Overall score (0-100) considering all metrics and session completion

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 