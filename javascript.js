
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
    <script>
function toggleMenu() {
    document.getElementById("nav-menu").classList.toggle("show");
}
</script>
<script>
// script.js

// Firebase SDKs imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, onSnapshot, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// --- IMPORTANT: PASTE YOUR FIREBASE CONFIGURATION HERE ---
// Get this object from your Firebase Project Settings -> Your apps -> Web app setup
const firebaseConfig = {
  apiKey: "AIzaSyDfHHOOTEy-p5HA4P5OOohqNZJAnj3cfr4",
  authDomain: "reviews-6057c.firebaseapp.com",
  projectId: "reviews-6057c",
  storageBucket: "reviews-6057c.firebasestorage.app",
  messagingSenderId: "73309790767",
  appId: "1:73309790767:web:eebb406e7ee6631c231cda",
  measurementId: "G-4F8Y8B97M6",     // Optional: Include if you use Google Analytics
};
// --- END OF FIREBASE CONFIGURATION ---


// Global Firebase variables
let app;
let db;
let auth;
let storage;
let userId = 'anonymous'; // Default to anonymous

// Function to show custom message box (replaces alert())
function showMessageBox(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    messageText.textContent = message;

    // Reset classes and apply new ones for styling and animation
    messageBox.className = 'fixed top-4 right-4 p-4 rounded-md shadow-lg text-white z-50 transition-transform transform translate-x-full';

    if (type === 'success') {
        messageBox.classList.add('bg-green-500');
    } else if (type === 'error') {
        messageBox.classList.add('bg-red-500');
    } else { // Default info
        messageBox.classList.add('bg-blue-500');
    }

    messageBox.classList.remove('translate-x-full'); // Slide in
    // Set timeout to slide out after 3 seconds
    setTimeout(() => {
        messageBox.classList.add('translate-x-full'); // Slide out
    }, 3000);
}

// Helper function to render star icons based on rating
function renderStars(rating) {
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
        // Use Tailwind classes for color based on rating
        starsHtml += `<span class="${i < rating ? 'text-yellow-500' : 'text-gray-300'}">&#9733;</span>`;
    }
    return starsHtml;
}

// Function to display reviews dynamically in the UI
function displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviewsContainer');
    const noReviewsMessage = document.getElementById('noReviewsMessage');
    reviewsContainer.innerHTML = ''; // Clear existing reviews before rendering new ones

    // Show/hide "No reviews yet" message
    if (reviews.length === 0) {
        noReviewsMessage.classList.remove('hidden');
        return;
    } else {
        noReviewsMessage.classList.add('hidden');
    }

    // Iterate through reviews and create HTML elements for each
    reviews.forEach(review => {
        const reviewCard = document.createElement('div');
        // Apply Tailwind classes for styling individual review cards
        reviewCard.className = 'bg-white/90 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300';
        reviewCard.innerHTML = `
            <div class="flex items-center mb-4">
                <div class="flex text-xl">
                    ${renderStars(review.rating)} </div>
                ${review.isVerifiedPurchase ? '<span class="ml-3 text-sm font-medium text-text-general">Verified Purchase</span>' : ''}
            </div>
            <h3 class="text-xl font-semibold text-text-dark mb-2">"${review.title}"</h3>
            <p class="text-text-general leading-relaxed mb-4">
                ${review.text}
            </p>
            ${review.photoURL ? `<img src="${review.photoURL}" alt="Customer uploaded photo" class="w-full h-auto rounded-md mb-4 object-cover" onerror="this.style.display='none';">` : ''}
            <div class="text-sm text-text-general">
                — ${review.reviewerName}, ${new Date(review.timestamp.toDate()).toLocaleDateString()}
            </div>
        `;
        reviewsContainer.appendChild(reviewCard); // Add review card to the container
    });
}

// Function to load reviews from Firestore in real-time
function loadReviews() {
    // Ensure Firebase instances are initialized and user is authenticated
    if (!db || !auth.currentUser) {
        console.log("Firestore or Auth not ready, cannot load reviews.");
        return;
    }

    // Define the collection path for public data, using the appId from your firebaseConfig
    const appId = firebaseConfig.appId;
    const reviewsColRef = collection(db, `artifacts/${appId}/public/data/reviews`);
    const q = query(reviewsColRef); // Create a query to listen for all documents in the collection

    // Set up a real-time listener using onSnapshot
    onSnapshot(q, (snapshot) => {
        const reviews = [];
        snapshot.forEach(doc => {
            reviews.push({ id: doc.id, ...doc.data() }); // Add document data and ID to reviews array
        });
        // Sort reviews by timestamp in descending order (newest first)
        reviews.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
        displayReviews(reviews); // Update the UI with the fetched reviews
    }, (error) => {
        console.error("Error loading reviews: ", error);
        showMessageBox("Error loading reviews.", "error"); // Display error message to user
    });
}

// Function to handle review form submission
async function submitReview(event) {
    event.preventDefault(); // Prevent default browser form submission behavior

    // Check if user is authenticated
    if (!auth.currentUser) {
        showMessageBox("You must be signed in to submit a review.", "error");
        return;
    }

    const form = event.target;
    // Get form input values
    const rating = parseInt(form.rating.value);
    const title = form['review-title'].value.trim();
    const text = form['review-text'].value.trim();
    const reviewerName = form['reviewer-name'].value.trim();
    const photoFile = form['review-photo'].files[0];

    // Basic client-side validation
    if (!rating || !title || !text || !reviewerName) {
        showMessageBox("Please fill in all required fields (Rating, Title, Review, Name).", "error");
        return;
    }

    // Disable submit button and show loading text
    document.getElementById('submitButton').disabled = true;
    document.getElementById('submitButton').textContent = 'Submitting...';

    let photoURL = '';
    // Handle photo upload if a file is selected
    if (photoFile) {
        try {
            // Create a storage reference with a unique name
            const storageRef = ref(storage, `review_photos/${auth.currentUser.uid}/${photoFile.name}_${Date.now()}`);
            const uploadTask = await uploadBytes(storageRef, photoFile); // Upload the file
            photoURL = await getDownloadURL(uploadTask.ref); // Get the public URL of the uploaded photo
            showMessageBox("Photo uploaded successfully!", "success");
        } catch (error) {
            console.error("Error uploading photo:", error);
            showMessageBox("Error uploading photo. Please try again.", "error");
            // Re-enable button and return on error
            document.getElementById('submitButton').disabled = false;
            document.getElementById('submitButton').textContent = 'Submit Review';
            return;
        }
    }

    try {
        // Add review data to Firestore
        // Use the appId from your firebaseConfig for the collection path
        const appId = firebaseConfig.appId;
        await addDoc(collection(db, `artifacts/${appId}/public/data/reviews`), {
            rating: rating,
            title: title,
            text: text,
            reviewerName: reviewerName,
            photoURL: photoURL,
            timestamp: serverTimestamp(), // Use Firestore's server timestamp for consistency
            userId: auth.currentUser.uid, // Store the user ID who submitted the review
            isVerifiedPurchase: true // This could be dynamic based on your business logic
        });
console.log("Review successfully written to Firestore!");


        showMessageBox("Review submitted successfully!", "success");
        form.reset(); // Clear the form fields after successful submission
    } catch (error) {
        console.error("Error adding document: ", error);
        showMessageBox("Error submitting review. Please try again.", "error");
    } finally {
        // Always re-enable the submit button and reset its text
        document.getElementById('submitButton').disabled = false;
        document.getElementById('submitButton').textContent = 'Submit Review';
    }
}

// Initialize Firebase and set up authentication listener when the window loads
window.onload = async () => {
    try {
        // Initialize Firebase services with your direct firebaseConfig
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        storage = getStorage(app);

        // Authenticate user: On a live site, you'll typically use
        // signInAnonymously() if you want unauthenticated users to submit,
        // or a proper user authentication flow (email/password, Google, etc.)
        // if reviews should only come from logged-in users.
        // For simplicity, we'll keep signInAnonymously for now.
        await signInAnonymously(auth);


        // Listen for authentication state changes
        onAuthStateChanged(auth, (user) => {
            if (user) {
                userId = user.uid; // Set global userId
                document.getElementById('currentUserId').textContent = `Your User ID: ${userId}`;
                loadReviews(); // Load reviews only after successful authentication
            } else {
                console.log("User is signed out or anonymous.");
                document.getElementById('currentUserId').textContent = `Your User ID: Anonymous`;
            }
        });

        // Attach the submit event listener to the review form
        document.getElementById('reviewForm').addEventListener('submit', submitReview);

    } catch (error) {
        console.error("Error initializing Firebase or authenticating: ", error);
        showMessageBox("Failed to load the review page. Please try again later.", "error");
    }
};
</script>