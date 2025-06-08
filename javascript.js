// --- Grandpas_website Main JavaScript ---
// NOTE: This file is meant to be used as a module. In your HTML, load with:
// <script type="module" src="javascript.js"></script>

// --------------- SIDEBAR & NAVIGATION ---------------

// Sidebar toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log("JavaScript Loaded");

    // Sidebar toggle
    const sidebarTab = document.querySelector('.sidebar-tab');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarTab && sidebar) {
        sidebarTab.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            console.log("Sidebar toggled");
        });
    }

    // Menu toggle (for responsive nav)
    const menuBtn = document.getElementById("menu-btn");
    const navMenu = document.getElementById("nav-menu");
    if (menuBtn && navMenu) {
        menuBtn.addEventListener('click', () => {
            navMenu.classList.toggle("show");
        });
    }

    // Carousel functionality
    const carouselImages = document.querySelector('.carousel-images');
    const leftArrow = document.querySelector('.left-arrow');
    const rightArrow = document.querySelector('.right-arrow');
    let currentIndex = 0;

    function updateCarousel() {
        if (!carouselImages || !carouselImages.children.length) return;
        const imageWidth = carouselImages.children[0].offsetWidth;
        carouselImages.style.transform = `translateX(-${currentIndex * imageWidth}px)`;
    }

    if (leftArrow && rightArrow && carouselImages) {
        leftArrow.addEventListener('click', () => {
            currentIndex = (currentIndex > 0) ? currentIndex - 1 : carouselImages.children.length - 1;
            updateCarousel();
        });

        rightArrow.addEventListener('click', () => {
            currentIndex = (currentIndex < carouselImages.children.length - 1) ? currentIndex + 1 : 0;
            updateCarousel();
        });

        window.addEventListener('resize', updateCarousel);
        updateCarousel();
    }
});

// --------------- FIREBASE INTEGRATION ---------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, onSnapshot, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// --- IMPORTANT: Use your real Firebase config ---
// Get this object from your Firebase Project Settings -> Your apps -> Web app setup
const firebaseConfig = {
  apiKey: "AIzaSyDfHHOOTEy-p5HA4P5OOohqNZJAnj3cfr4",
  authDomain: "reviews-6057c.firebaseapp.com",
  projectId: "reviews-6057c",
  storageBucket: "reviews-6057c.appspot.com", // <-- Fixed: appspot.com, not firebasestorage.app
  messagingSenderId: "73309790767",
  appId: "1:73309790767:web:eebb406e7ee6631c231cda",
  measurementId: "G-4F8Y8B97M6"
};

// Global Firebase variables
let app;
let db;
let auth;
let storage;
let userId = 'anonymous'; // Default to anonymous

// --------------- UTILITIES ---------------

// Show user feedback message
let messageTimeout;
function showMessageBox(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    if (!messageBox || !messageText) return;

    messageText.textContent = message;
    messageBox.className = 'fixed top-4 right-4 p-4 rounded-md shadow-lg text-white z-50 transition-transform transform translate-x-full';

    if (type === 'success') {
        messageBox.classList.add('bg-green-500');
    } else if (type === 'error') {
        messageBox.classList.add('bg-red-500');
    } else {
        messageBox.classList.add('bg-blue-500');
    }

    messageBox.classList.remove('translate-x-full'); // Slide in

    if (messageTimeout) clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
        messageBox.classList.add('translate-x-full'); // Slide out
    }, 3000);
}

// Render stars for rating
function renderStars(rating) {
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
        starsHtml += `<span class="${i < rating ? 'text-yellow-500' : 'text-gray-300'}">&#9733;</span>`;
    }
    return starsHtml;
}

// Display reviews in the UI
function displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviewsContainer');
    const noReviewsMessage = document.getElementById('noReviewsMessage');
    if (!reviewsContainer || !noReviewsMessage) return;

    reviewsContainer.innerHTML = '';

    if (reviews.length === 0) {
        noReviewsMessage.classList.remove('hidden');
        return;
    } else {
        noReviewsMessage.classList.add('hidden');
    }

    reviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'bg-white/90 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300';
        reviewCard.innerHTML = `
            <div class="flex items-center mb-4">
                <div class="flex text-xl">
                    ${renderStars(review.rating)}
                </div>
                ${review.isVerifiedPurchase ? '<span class="ml-3 text-sm font-medium text-text-general">Verified Purchase</span>' : ''}
            </div>
            <h3 class="text-xl font-semibold text-text-dark mb-2">"${review.title}"</h3>
            <p class="text-text-general leading-relaxed mb-4">
                ${review.text}
            </p>
            ${review.photoURL ? `<img src="${review.photoURL}" alt="Customer uploaded photo" class="w-full h-auto rounded-md mb-4 object-cover" onerror="this.style.display='none';">` : ''}
            <div class="text-sm text-text-general">
                — ${review.reviewerName}, ${review.timestamp && review.timestamp.toDate ? new Date(review.timestamp.toDate()).toLocaleDateString() : ""}
            </div>
        `;
        reviewsContainer.appendChild(reviewCard);
    });
}

// Load reviews from Firestore in real-time
function loadReviews() {
    if (!db || !auth.currentUser) {
        console.log("Firestore or Auth not ready, cannot load reviews.");
        return;
    }
    const appId = firebaseConfig.appId;
    const reviewsColRef = collection(db, `artifacts/${appId}/public/data/reviews`);
    const q = query(reviewsColRef);

    onSnapshot(q, (snapshot) => {
        const reviews = [];
        snapshot.forEach(doc => {
            reviews.push({ id: doc.id, ...doc.data() });
        });
        reviews.sort((a, b) => {
            if (!a.timestamp || !a.timestamp.toDate || !b.timestamp || !b.timestamp.toDate) return 0;
            return b.timestamp.toDate() - a.timestamp.toDate();
        });
        displayReviews(reviews);
    }, (error) => {
        console.error("Error loading reviews: ", error);
        showMessageBox("Error loading reviews.", "error");
    });
}

// Handle review form submission
async function submitReview(event) {
    event.preventDefault();
    if (!auth.currentUser) {
        showMessageBox("You must be signed in to submit a review.", "error");
        return;
    }

    const form = event.target;
    const rating = parseInt(form.rating.value);
    const title = form['review-title'].value.trim();
    const text = form['review-text'].value.trim();
    const reviewerName = form['reviewer-name'].value.trim();
    const photoFile = form['review-photo'].files[0];

    if (!rating || !title || !text || !reviewerName) {
        showMessageBox("Please fill in all required fields (Rating, Title, Review, Name).", "error");
        return;
    }

    const submitButton = document.getElementById('submitButton');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
    }

    let photoURL = '';
    if (photoFile) {
        try {
            const storageRef = ref(storage, `review_photos/${auth.currentUser.uid}/${photoFile.name}_${Date.now()}`);
            const uploadTask = await uploadBytes(storageRef, photoFile);
            photoURL = await getDownloadURL(uploadTask.ref);
            showMessageBox("Photo uploaded successfully!", "success");
        } catch (error) {
            console.error("Error uploading photo:", error);
            showMessageBox("Error uploading photo. Please try again.", "error");
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit Review';
            }
            return;
        }
    }

    try {
        const appId = firebaseConfig.appId;
        await addDoc(collection(db, `artifacts/${appId}/public/data/reviews`), {
            rating,
            title,
            text,
            reviewerName,
            photoURL,
            timestamp: serverTimestamp(),
            userId: auth.currentUser.uid,
            isVerifiedPurchase: true
        });
        console.log("Review successfully written to Firestore!");
        showMessageBox("Review submitted successfully!", "success");
        form.reset();
    } catch (error) {
        console.error("Error adding document: ", error);
        showMessageBox("Error submitting review. Please try again.", "error");
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Review';
        }
    }
}

// --------------- APP INITIALIZATION ---------------

window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Firebase
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        storage = getStorage(app);

        // Authenticate user
        await signInAnonymously(auth);

        // Auth state listener
        onAuthStateChanged(auth, (user) => {
            const currentUserIdElem = document.getElementById('currentUserId');
            if (user) {
                userId = user.uid;
                if (currentUserIdElem) {
                    currentUserIdElem.textContent = `Your User ID: ${userId}`;
                }
                loadReviews();
            } else {
                if (currentUserIdElem) {
                    currentUserIdElem.textContent = `Your User ID: Anonymous`;
                }
            }
        });

        // Attach review form submit handler
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.addEventListener('submit', submitReview);
        }
    } catch (error) {
        console.error("Error initializing Firebase or authenticating: ", error);
        showMessageBox("Failed to load the review page. Please try again later.", "error");
    }
});