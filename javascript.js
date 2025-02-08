<script>
document.addEventListener('DOMContentLoaded', () => {
    console.log("JavaScript Loaded");

    // Sidebar toggle functionality
    document.querySelector('.sidebar-tab').addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('open');
        console.log("Sidebar toggled");
    });


</script>
<script>
    const carouselImages = document.querySelector('.carousel-images');
    const leftArrow = document.querySelector('.left-arrow');
    const rightArrow = document.querySelector('.right-arrow');

    let currentIndex = 0;

    // Scroll to the previous image
    leftArrow.addEventListener('click', () => {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : carouselImages.children.length - 1;
        updateCarousel();
    });

    // Scroll to the next image
    rightArrow.addEventListener('click', () => {
        currentIndex = (currentIndex < carouselImages.children.length - 1) ? currentIndex + 1 : 0;
        updateCarousel();
    });

    // Update carousel position
    function updateCarousel() {
        const imageWidth = carouselImages.children[0].offsetWidth;
        carouselImages.style.transform = `translateX(-${currentIndex * imageWidth}px)`;
    }
</script>
