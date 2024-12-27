# Toza Carousel

A lightweight, vanilla JavaScript carousel library that supports both horizontal and vertical orientations. Built with modern ES6 modules and zero dependencies.

## Features

- Horizontal and vertical orientations
- Touch-friendly swipe gestures
- Smooth animations and transitions
- Autoplay with customizable interval
- Navigation dots
- Loop option
- Event-based architecture
- No dependencies
- Modern ES6 module format

## Installation

```bash
npm install toza
```

## Usage

```javascript
import { Carousel } from 'toza';

// Create a horizontal carousel
const carousel = new Carousel({
    container: document.getElementById('carouselContainer'),
    orientation: 'horizontal', // or 'vertical'
    duration: 300,
    loop: true,
    autoplay: false,
    autoplayInterval: 3000
});

// Listen for slide changes
carousel.container.addEventListener('change', (e) => {
    console.log('Current slide index:', e.detail.index);
});

// Control methods
carousel.next();      // Go to next slide
carousel.prev();      // Go to previous slide
carousel.goToSlide(2); // Go to specific slide

// Autoplay controls
carousel.startAutoplay();
carousel.stopAutoplay();

// Clean up
carousel.destroy();
```

## HTML Structure

```html
<div id="carouselContainer">
    <div>Slide 1</div>
    <div>Slide 2</div>
    <div>Slide 3</div>
</div>
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| container | HTMLElement | required | Container element for the carousel |
| orientation | string | 'horizontal' | Carousel orientation ('horizontal' or 'vertical') |
| duration | number | 300 | Transition duration in milliseconds |
| loop | boolean | true | Whether to loop through slides |
| autoplay | boolean | false | Whether to autoplay slides |
| autoplayInterval | number | 3000 | Autoplay interval in milliseconds |

## Events

The carousel dispatches a `change` event on the container element whenever the slide changes. The event detail contains the current slide index:

```javascript
carousel.container.addEventListener('change', (e) => {
    console.log('Current slide:', e.detail.index);
});
```

## Methods

- `next()`: Go to next slide
- `prev()`: Go to previous slide
- `goToSlide(index)`: Go to specific slide
- `startAutoplay()`: Start autoplay
- `stopAutoplay()`: Stop autoplay
- `destroy()`: Clean up carousel

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

ISC
