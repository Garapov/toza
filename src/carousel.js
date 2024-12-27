export class Carousel {
    constructor(selector, options = {}) {
        // Get container
        this.container = document.querySelector(selector);
        if (!this.container) throw new Error('Carousel container not found');

        // Default options
        this.options = {
            slideDirection: 'horizontal',
            autoHeight: false,
            itemsPerView: 1,
            dragThreshold: 50, // minimum drag distance to trigger slide change
            ...options
        };

        // Store direction
        this.isVertical = this.options.slideDirection === 'vertical';

        // Initialize drag state
        this.dragState = {
            isDragging: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            startTranslate: 0
        };

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
        
        // Calculate slide width based on itemsPerView
        const slideWidth = wrapperWidth / this.options.itemsPerView;
        
        // Set slide dimensions
        slides.forEach(slide => {
            slide.style.width = `${slideWidth}px`;
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

        // Get current slide and the next (itemsPerView - 1) slides
        const activeSlides = [];
        for (let i = 0; i < this.options.itemsPerView; i++) {
            const slideIndex = this.currentSlide + i;
            if (slideIndex >= this.totalSlides) break;
            
            const slide = this.track.children[slideIndex];
            if (slide) {
                activeSlides.push(slide);
            }
        }

        if (activeSlides.length === 0) return;

        // Get max height from all active slides
        const heights = activeSlides.map(slide => this.getSlideHeight(slide));
        const maxHeight = Math.max(...heights);
        
        // Set track height
        this.track.style.height = `${maxHeight}px`;
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

        // Mouse drag events
        this.track.addEventListener('mousedown', this.handleDragStart.bind(this));
        document.addEventListener('mousemove', this.handleDragMove.bind(this));
        document.addEventListener('mouseup', this.handleDragEnd.bind(this));
        document.addEventListener('mouseleave', this.handleDragEnd.bind(this));

        // Prevent default dragging behavior
        this.track.addEventListener('dragstart', (e) => e.preventDefault());
    }

    handleDragStart(e) {
        this.dragState.isDragging = true;
        this.dragState.startX = e.clientX;
        this.dragState.startY = e.clientY;
        this.dragState.currentX = e.clientX;
        this.dragState.currentY = e.clientY;

        // Get current transform value
        const transform = window.getComputedStyle(this.track).transform;
        const matrix = new DOMMatrix(transform);
        this.dragState.startTranslate = this.isVertical ? matrix.m42 : matrix.m41;

        // Change cursor and disable transition during drag
        this.track.style.cursor = 'grabbing';
        this.track.style.transition = 'none';
    }

    handleDragMove(e) {
        if (!this.dragState.isDragging) return;

        this.dragState.currentX = e.clientX;
        this.dragState.currentY = e.clientY;

        const deltaX = this.dragState.currentX - this.dragState.startX;
        const deltaY = this.dragState.currentY - this.dragState.startY;

        // Calculate new transform based on drag distance
        const delta = this.isVertical ? deltaY : deltaX;
        const newTranslate = this.dragState.startTranslate + delta;

        // Apply the transform
        this.track.style.transform = `translate${this.isVertical ? 'Y' : 'X'}(${newTranslate}px)`;
    }

    handleDragEnd() {
        if (!this.dragState.isDragging) return;

        // Reset cursor and restore transition
        this.track.style.cursor = '';
        this.track.style.transition = '';

        const delta = this.isVertical 
            ? this.dragState.currentY - this.dragState.startY
            : this.dragState.currentX - this.dragState.startX;

        // Determine if we should change slide based on drag distance
        if (Math.abs(delta) >= this.options.dragThreshold) {
            if (delta > 0) {
                this.prev();
            } else {
                this.next();
            }
        } else {
            // If drag distance is small, return to current slide
            this.goTo(this.currentSlide);
        }

        this.dragState.isDragging = false;
    }

    goTo(index, immediate = false) {
        // Validate index
        const maxIndex = Math.max(0, this.totalSlides - this.options.itemsPerView);
        if (index < 0) index = maxIndex;
        if (index > maxIndex) index = 0;
        
        // Remove active class from all slides
        Array.from(this.track.children).forEach(slide => {
            slide.classList.remove('toza-carousel-slide-active');
        });
        
        // Update position
        this.currentSlide = index;
        
        // Calculate offset based on slide width and itemsPerView
        const slideWidth = 100 / this.options.itemsPerView;
        const offset = index * -slideWidth;

        if (immediate) {
            this.track.style.transition = 'none';
        }
        
        this.track.style.transform = `translate${this.isVertical ? 'Y' : 'X'}(${offset}%)`;

        // Add active class to current and next visible slides
        for (let i = 0; i < this.options.itemsPerView; i++) {
            const slideIndex = this.currentSlide + i;
            if (slideIndex >= this.totalSlides) break;
            
            const slide = this.track.children[slideIndex];
            if (slide) {
                slide.classList.add('toza-carousel-slide-active');
            }
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
