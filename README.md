# 🎮 Square Ninja - Educational Math Game

A fun and interactive educational game that teaches students to identify perfect squares through engaging Fruit Ninja-style gameplay.

## 🎯 Game Overview

Square Ninja is an educational math game designed for Class 8 students to practice identifying perfect squares in an entertaining way. Players slice falling numbers to score points, but they must be careful to only slice perfect squares!

## 🎮 How to Play

### Objective
- Slice only the **perfect squares** (1, 4, 9, 16, 25, 36, 49, 64, 81, 100, etc.)
- Avoid slicing non-perfect squares
- Build combos by slicing consecutive perfect squares
- Survive as long as possible with your 3 lives

### Controls
- **Desktop**: Click and drag mouse to slice numbers
- **Mobile/Tablet**: Touch and swipe to slice numbers
- **Gameplay**: Numbers appear from the bottom and arc upward - slice them at the right moment!

### Scoring System
- **Correct slice** (perfect square): +1 point, combo +1
- **Wrong slice** (non-perfect square): -1 life, combo resets to 0
- **Missed numbers**: No penalty - only wrong slices cost lives!

### Game Features
- **3 Lives**: Make your slices count
- **Combo System**: Build streaks for better performance tracking
- **Smart Physics**: Numbers launch high and descend slowly for optimal gameplay
- **Visual Feedback**: Golden slice trails and red slash effects

## 🎨 Design Features

### Beautiful UI
- **Yellowish Theme**: Warm amber and yellow gradient design
- **Minimalistic**: Clean, distraction-free interface
- **Responsive**: Optimized for all screen sizes
- **Modern**: Glass morphism effects and smooth animations

### Visual Elements
- **Gradient Backgrounds**: Warm amber-to-orange gradients
- **Floating Orbs**: Subtle decorative background elements
- **Shadow Effects**: Depth and dimension throughout the UI
- **Smooth Animations**: Hover effects and transitions

## 📱 Mobile Optimization

### Responsive Design
- **Adaptive Canvas**: Automatically resizes for different screen sizes
  - Mobile: 400x500px max
  - Tablet: 600x500px
  - Desktop: 800x600px
- **Touch Controls**: Full touch and swipe support
- **Responsive UI**: All elements scale appropriately
- **Mobile-Friendly**: Larger hit areas and optimized physics

### Cross-Platform Support
- **iOS/Android**: Native touch controls
- **Tablets**: Optimized for medium screens
- **Desktop**: Mouse and keyboard support
- **Web Browsers**: Works on all modern browsers

## 🛠️ Technical Implementation

### Technology Stack
- **Framework**: Next.js 15.5.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Fonts**: Geist Sans and Geist Mono

### Game Engine Features
- **Canvas-based Rendering**: Smooth 60fps gameplay
- **Physics Simulation**: Realistic gravity and trajectory
- **Collision Detection**: Precise hit detection
- **State Management**: React hooks for game state
- **Performance Optimized**: Efficient rendering and cleanup

### Smart Physics System
- **Zone-based Speed Control**: Numbers slow down in clickable areas
- **Adaptive Gravity**: Different gravity when ascending vs descending
- **Mobile Optimization**: Adjusted physics for smaller screens
- **Boundary Management**: Numbers stay within playable area

## 🎓 Educational Value

### Learning Objectives
- **Perfect Square Recognition**: Visual identification of perfect squares
- **Mental Math**: Quick calculation and pattern recognition
- **Mathematical Confidence**: Gamified learning reduces math anxiety
- **Problem Solving**: Strategic thinking about which numbers to slice

### Curriculum Alignment
- **Grade Level**: Class 8 (Ages 13-14)
- **Subject**: Mathematics - Number Systems
- **Topics**: Perfect squares, square roots, number patterns
- **Skills**: Pattern recognition, mental calculation, decision making

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation
```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd sih_8

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
sih_8/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── globals.css         # Global styles
│   │   ├── maths/
│   │   │   ├── page.tsx        # Math games menu
│   │   │   └── square-game/
│   │   │       └── page.tsx    # Square Ninja game
│   │   └── science/
│   │       └── page.tsx        # Science games menu
│   └── public/
│       ├── sc.png              # Science icon
│       ├── fruitninja_game.mp4 # Reference video
│       └── gamereview.mp4      # Game review video
├── package.json
├── next.config.ts
├── tailwind.config.js
└── README.md
```

## 🎯 Game Flow

### 1. Initial Load
- Instructions modal appears with game blurred in background
- Clear explanation of rules and perfect squares
- "Move to Game" button to proceed

### 2. Main Screen
- Clean interface with game title
- Large "Start Game" button
- Canvas ready for gameplay

### 3. Active Gameplay
- Numbers launch from bottom with realistic physics
- Score, Lives, and Combo displayed in real-time
- Smooth slicing mechanics with visual feedback

### 4. Game Over
- Final score and best combo displayed
- Options to play again or return to math games menu

## 🎨 UI/UX Features

### Visual Design
- **Color Palette**: Warm yellows, ambers, and oranges
- **Typography**: Bold, readable fonts with proper hierarchy
- **Spacing**: Consistent margins and padding throughout
- **Shadows**: Subtle depth effects for modern look

### User Experience
- **Intuitive Controls**: Natural slicing gestures
- **Clear Feedback**: Visual and numerical feedback for all actions
- **Responsive Layout**: Adapts to any screen size
- **Smooth Animations**: 60fps gameplay with smooth transitions

### Accessibility
- **High Contrast**: Readable text on all backgrounds
- **Large Touch Targets**: Easy interaction on mobile devices
- **Clear Instructions**: Comprehensive how-to-play guide
- **Error Prevention**: Forgiving gameplay mechanics

## 🔧 Customization Options

### Game Parameters (easily adjustable)
- **Lives**: Currently set to 3, easily changeable
- **Spawn Rate**: Numbers appear every 2.5 seconds
- **Physics**: Gravity, launch speed, and trajectories
- **Scoring**: Point values and combo mechanics
- **Difficulty**: Hit radius and number generation ratios

### Visual Customization
- **Themes**: Color schemes easily modifiable via Tailwind
- **Canvas Size**: Responsive system supports any dimensions
- **UI Elements**: Modular components for easy updates
- **Animations**: Transition durations and effects configurable

## 🎯 Perfect Squares Reference

The game includes perfect squares from 1 to 400:
- **Single digits**: 1, 4, 9
- **Double digits**: 16, 25, 36, 49, 64, 81
- **Triple digits**: 100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400

## 🚀 Future Enhancements

### Potential Features
- **Difficulty Levels**: Easy, Medium, Hard modes
- **Sound Effects**: Audio feedback for slices and scores
- **Leaderboards**: High score tracking and sharing
- **Achievements**: Unlock badges for milestones
- **More Math Topics**: Cube numbers, prime numbers, etc.
- **Multiplayer Mode**: Compete with friends
- **Progress Tracking**: Student performance analytics

### Technical Improvements
- **Offline Support**: PWA capabilities
- **Performance**: Further optimization for older devices
- **Analytics**: Detailed gameplay metrics
- **Accessibility**: Screen reader support and keyboard navigation

## 📄 License

This project is part of an educational initiative for Class 8 mathematics learning.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

## 📞 Support

For questions or support regarding the Square Ninja game, please refer to the in-game instructions or contact the development team.

---

**Square Ninja** - Making math fun, one slice at a time! 🥷✨