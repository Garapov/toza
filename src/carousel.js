class Carousel {
    constructor(selector, options = {}) {
        // Get container
        this.container = document.querySelector(selector);
        if (!this.container) throw new Error('Carousel container not found');

        // Default options
        this.options = {
            slideDirection: 'horizontal',
            autoHeight: false,
            itemsPerView: 1,
            gap: 0,  // Add gap option with default 0
            dragThreshold: 50, // minimum drag distance to trigger slide change
            ...options
        };

        // Convert gap to number and handle units
        this.options.gap = parseInt(this.options.gap) || 0;

        // Force autoHeight true in vertical mode
        if (this.options.slideDirection === 'vertical') {
            this.options.autoHeight = true;
        }

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

        this.init();
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
        console.log('=== Starting calculateDimensions ===');
        // Get all slides
        const slides = Array.from(this.track.children);
        this.totalSlides = slides.length;
        console.log('Total slides:', this.totalSlides);
        
        // Get wrapper dimensions
        const wrapperWidth = this.wrapper.offsetWidth;
        console.log('Wrapper width:', wrapperWidth);
        console.log('Is vertical mode:', this.isVertical);
        console.log('Items per view:', this.options.itemsPerView);
        console.log('Gap:', this.options.gap);
        
        if (this.isVertical) {
            // In vertical mode
            slides.forEach((slide, index) => {
                slide.style.width = '100%';
                // Don't set fixed height, let content determine it
                slide.style.height = 'auto';
                // Add margin-bottom for gap except last slide
                slide.style.marginBottom = index < slides.length - 1 ? `${this.options.gap}px` : '0';
                
                console.log(`Slide ${index} dimensions:`, {
                    width: slide.style.width,
                    height: slide.style.height,
                    actualHeight: slide.offsetHeight,
                    marginBottom: slide.style.marginBottom
                });
            });

            // Initialize slide positions
            this.updateSlidePositions();
        } else {
            // In horizontal mode
            // Calculate total width needed for all slides with gaps
            const totalGapsNeeded = this.totalSlides - 1;
            const totalGapWidth = this.options.gap * totalGapsNeeded;
            const totalWidth = wrapperWidth * Math.ceil(this.totalSlides / this.options.itemsPerView);
            const slideWidth = (wrapperWidth - (this.options.gap * (this.options.itemsPerView - 1))) / this.options.itemsPerView;
            
            // Set track width to accommodate all slides and gaps
            this.track.style.width = `${totalWidth + totalGapWidth}px`;
            
            slides.forEach((slide, index) => {
                slide.style.width = `${slideWidth}px`;
                // Add margin-right for gap except last slide
                slide.style.marginRight = index < this.totalSlides - 1 ? `${this.options.gap}px` : '0';
            });
            
            console.log('Horizontal mode dimensions:', {
                wrapperWidth,
                totalWidth,
                slideWidth,
                totalGapWidth,
                slidesPerGroup: this.options.itemsPerView
            });
            
            // Only update height if autoHeight is true
            if (this.options.autoHeight) {
                this.updateHeight();
            }
        }
        console.log('=== End calculateDimensions ===');
    }

    getSlideHeight(slide) {
        // Temporarily remove any fixed height
        const originalHeight = slide.style.height;
        slide.style.height = 'auto';
        
        // Get the actual content height
        const contentHeight = slide.offsetHeight;
        
        // Restore original height
        slide.style.height = originalHeight;
        
        return contentHeight;
    }

    updateHeight(nextIndex = null) {
        console.log('=== Starting updateHeight ===');
        console.log('Current slide:', this.currentSlide, 'Next index:', nextIndex);

        // Get current or next slides
        const targetIndex = nextIndex !== null ? nextIndex : this.currentSlide;
        const activeSlides = [];
        for (let i = 0; i < this.options.itemsPerView; i++) {
            const slideIndex = targetIndex + i;
            if (slideIndex >= this.totalSlides) break;
            
            const slide = this.track.children[slideIndex];
            if (slide) {
                activeSlides.push(slide);
                console.log(`Including slide ${slideIndex} in height calculation`);
            }
        }

        if (activeSlides.length === 0) {
            console.log('No active slides found');
            return;
        }

        // Reset all slide heights first
        Array.from(this.track.children).forEach(slide => {
            slide.style.height = '';
        });

        if (this.isVertical) {
            // Get natural heights of active slides
            const heights = activeSlides.map(slide => slide.offsetHeight);
            
            // Calculate total height including gaps between active slides
            const totalGaps = activeSlides.length - 1;
            const totalGapHeight = this.options.gap * totalGaps;
            const totalHeight = heights.reduce((sum, height) => sum + height, 0) + totalGapHeight;
            
            // Set wrapper height with animation
            requestAnimationFrame(() => {
                this.wrapper.style.height = `${totalHeight}px`;
            });
            console.log('Set wrapper height to:', totalHeight, '(including gaps:', totalGapHeight, ')');
            
            this.updateSlidePositions();
        } else if (this.options.autoHeight) {
            // Horizontal mode with autoHeight
            const heights = activeSlides.map(slide => slide.offsetHeight);
            const maxHeight = Math.max(...heights);

            // Set height for both track and active slides
            requestAnimationFrame(() => {
                this.track.style.height = `${maxHeight}px`;
                activeSlides.forEach(slide => {
                    slide.style.height = `${maxHeight}px`;
                });
            });

            console.log('Set track and active slides height to max:', maxHeight);
        }
        
        console.log('=== End updateHeight ===');
    }

    updateSlidePositions() {
        if (!this.isVertical) return;

        const slides = Array.from(this.track.children);
        this.slidePositions = [0];
        let currentPosition = 0;

        // Calculate positions including gaps
        for (let i = 0; i < slides.length - 1; i++) {
            const slide = slides[i];
            currentPosition += slide.offsetHeight + this.options.gap;
            this.slidePositions.push(currentPosition);
        }

        // Set track height to accommodate all slides and gaps
        const lastSlide = slides[slides.length - 1];
        const totalHeight = currentPosition + lastSlide.offsetHeight;
        requestAnimationFrame(() => {
            this.track.style.height = `${totalHeight}px`;
        });
        
        console.log('Updated slide positions:', this.slidePositions);
        console.log('Total track height:', totalHeight);
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
        
        // Get current transform value
        const transform = window.getComputedStyle(this.track).transform;
        const matrix = new DOMMatrix(transform);
        const currentTranslate = this.isVertical ? matrix.m42 : matrix.m41;

        // Calculate new transform
        const newTranslate = this.dragState.startTranslate + delta;

        // Calculate wrapper size and slide size
        const wrapperSize = this.isVertical ? this.wrapper.offsetHeight : this.wrapper.offsetWidth;
        const slideSize = wrapperSize / this.options.itemsPerView;
        const maxTranslate = 0;
        const minTranslate = -((this.totalSlides - this.options.itemsPerView) * slideSize);

        // Constrain translation within bounds
        const constrainedTranslate = Math.max(minTranslate, Math.min(maxTranslate, newTranslate));

        // Apply the transform
        this.track.style.transform = `translate${this.isVertical ? 'Y' : 'X'}(${constrainedTranslate}px)`;
    }

    handleDragEnd() {
        if (!this.dragState.isDragging) return;

        // Reset cursor and restore transition
        this.track.style.cursor = '';
        this.track.style.transition = '';

        const delta = this.isVertical 
            ? this.dragState.currentY - this.dragState.startY
            : this.dragState.currentX - this.dragState.startX;

        // Get wrapper size and calculate slide size
        const wrapperSize = this.isVertical ? this.wrapper.offsetHeight : this.wrapper.offsetWidth;
        const slideSize = wrapperSize / this.options.itemsPerView;

        // Determine if we should change slide based on drag distance
        if (Math.abs(delta) >= this.options.dragThreshold) {
            const slidesToMove = Math.round(delta / slideSize);
            const newIndex = this.currentSlide - slidesToMove;
            this.goTo(newIndex);
        } else {
            // If drag distance is small, return to current slide
            this.goTo(this.currentSlide);
        }

        this.dragState.isDragging = false;
    }

    init() {
        console.log('=== Starting init ===');
        // Count total slides
         // Initialize
         this.currentSlide = 0;
         this.buildStructure();
         this.calculateDimensions();
         this.bindEvents();
         
         // Show initial slide
         this.goTo(0, true);
 
         this.wrapper.classList.add('toza-carousel-initialized');
        
        console.log('=== End init ===');
    }

    goTo(index, immediate = false) {
        console.log('=== Starting goTo ===');
        console.log('Going to index:', index);
        console.log('Current slide:', this.currentSlide);
        console.log('Total slides:', this.totalSlides);
        console.log('Items per view:', this.options.itemsPerView);
        
        // Validate index
        const maxIndex = Math.max(0, this.totalSlides - this.options.itemsPerView);
        console.log('Max index:', maxIndex);
        
        if (index < 0) index = maxIndex;
        if (index > maxIndex) index = 0;
        
        console.log('Adjusted index:', index);

        // Pre-calculate height for the next set of slides
        if (this.isVertical || this.options.autoHeight) {
            this.updateHeight(index);
        }
        
        // Remove active class from all slides
        Array.from(this.track.children).forEach(slide => {
            slide.classList.remove('toza-carousel-slide-active');
        });
        
        // Update position
        this.currentSlide = index;

        if (immediate) {
            this.track.style.transition = 'none';
        }
        
        let offset;
        if (this.isVertical) {
            // In vertical mode, use pixel-based translation from stored positions
            offset = -this.slidePositions[index];
            requestAnimationFrame(() => {
                this.track.style.transform = `translateY(${offset}px)`;
            });
        } else {
            // In horizontal mode, calculate offset including gaps
            const slideWidth = (this.wrapper.offsetWidth - (this.options.gap * (this.options.itemsPerView - 1))) / this.options.itemsPerView;
            offset = -(index * (slideWidth + this.options.gap));
            requestAnimationFrame(() => {
                this.track.style.transform = `translateX(${offset}px)`;
            });
        }
        
        console.log('Translation calculation:', {
            offset,
            isVertical: this.isVertical,
            transform: this.track.style.transform
        });

        // Add active class to current and next visible slides
        for (let i = 0; i < this.options.itemsPerView; i++) {
            const slideIndex = this.currentSlide + i;
            if (slideIndex >= this.totalSlides) break;
            
            const slide = this.track.children[slideIndex];
            if (slide) {
                slide.classList.add('toza-carousel-slide-active');
                console.log(`Activated slide ${slideIndex}`);
            }
        }

        if (immediate) {
            // Force reflow
            this.track.offsetHeight;
            // Restore transition
            this.track.style.transition = '';
        }
        
        console.log('=== End goTo ===');
    }

    next() {
        this.goTo(this.currentSlide + 1);
    }

    prev() {
        this.goTo(this.currentSlide - 1);
    }
}

// Make Carousel available globally
window.Carousel = Carousel;
