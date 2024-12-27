export class Carousel {
    constructor(selector, options = {}) {
        // Get container
        this.container = document.querySelector(selector);
        if (!this.container) throw new Error('Carousel container not found');

        // Default options
        this.options = {
            slideDirection: 'horizontal',
            autoHeight: false,
            ...options
        };

        // Store direction
        this.isVertical = this.options.slideDirection === 'vertical';

        // Initialize
        this.currentSlide = 0;
        this.buildStructure();
        this.calculateDimensions();
        this.bindEvents();
        
        // Show initial slide
        this.goTo(0, true);
    }

    buildStructure() {
        // Create wrapper
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'toza-carousel';
        
        // Find or create track
        this.track = this.container.querySelector('.toza-carousel-track');
        if (!this.track) {
            // Create track and slides
            this.track = document.createElement('div');
            this.track.className = 'toza-carousel-track';
            
            // Move slides to track
            while (this.container.firstChild) {
                const slide = document.createElement('div');
                slide.className = this.container.firstChild.className;
                slide.classList.add('toza-carousel-slide');
                slide.appendChild(this.container.firstChild);
                this.track.appendChild(slide);
            }
        } else {
            // Add toza-carousel-slide class to existing slides
            Array.from(this.track.children).forEach(child => {
                if (!child.classList.contains('toza-carousel-slide')) {
                    child.classList.add('toza-carousel-slide');
                }
            });
        }
        
        // Add vertical class if needed
        if (this.isVertical) {
            this.track.classList.add('vertical');
        }
        
        // Build structure
        this.wrapper.appendChild(this.track);
        this.container.appendChild(this.wrapper);
        
        // Store total slides
        this.totalSlides = this.track.children.length;

        // Create height measurement container
        this.heightContainer = document.createElement('div');
        this.heightContainer.style.cssText = 'position: absolute; visibility: hidden; width: 100%;';
        this.wrapper.appendChild(this.heightContainer);

        // Add transition end listener
        this.track.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'transform') {
                this.updateHeight();
            }
        });
    }

    calculateDimensions() {
        // Get all slides
        const slides = Array.from(this.track.children);
        
        // Get wrapper dimensions
        const wrapperWidth = this.wrapper.offsetWidth;
        
        // Set slide dimensions
        slides.forEach(slide => {
            slide.style.width = `${wrapperWidth}px`;
        });
    }

    getSlideHeight(slide) {
        // Clone the slide
        const clone = slide.cloneNode(true);
        
        // Add active class to measure correct height
        clone.classList.add('toza-carousel-slide-active');
        
        // Add to measurement container
        this.heightContainer.innerHTML = '';
        this.heightContainer.appendChild(clone);
        
        // Get height
        const height = clone.offsetHeight;
        
        // Clean up
        this.heightContainer.innerHTML = '';
        
        return height;
    }

    updateHeight() {
        if (!this.options.autoHeight) return;

        // Get current slide
        const currentSlide = this.track.children[this.currentSlide];
        if (!currentSlide) return;

        // Get height using measurement container
        const slideHeight = this.getSlideHeight(currentSlide);
        
        // Set track height
        this.track.style.height = `${slideHeight}px`;
    }

    bindEvents() {
        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prev();
            } else if (e.key === 'ArrowRight') {
                this.next();
            }
        });

        // Recalculate dimensions on window resize
        window.addEventListener('resize', () => {
            this.calculateDimensions();
            this.goTo(this.currentSlide, true);
        });
    }

    goTo(index, immediate = false) {
        // Validate index
        if (index < 0) index = this.totalSlides - 1;
        if (index >= this.totalSlides) index = 0;
        
        // Remove active class from all slides
        Array.from(this.track.children).forEach(slide => {
            slide.classList.remove('toza-carousel-slide-active');
        });
        
        // Update position
        this.currentSlide = index;
        const offset = index * -100;

        if (immediate) {
            this.track.style.transition = 'none';
        }
        
        this.track.style.transform = `translate${this.isVertical ? 'Y' : 'X'}(${offset}%)`;

        // Add active class to current slide
        const currentSlide = this.track.children[this.currentSlide];
        if (currentSlide) {
            currentSlide.classList.add('toza-carousel-slide-active');
        }

        if (immediate) {
            // Force reflow
            this.track.offsetHeight;
            // Restore transition
            this.track.style.transition = '';
            // Update height immediately
            this.updateHeight();
        }
    }

    next() {
        this.goTo(this.currentSlide + 1);
    }

    prev() {
        this.goTo(this.currentSlide - 1);
    }
}
