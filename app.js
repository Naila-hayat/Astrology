// ---------- Fade sections in as you scroll to them ----------
const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.15 });

revealElements.forEach(function (el) {
  revealObserver.observe(el);
});

// ---------- Navbar background on scroll ----------
const navbar = document.getElementById("navbar");

function updateNavbar() {
  if (window.scrollY > 40) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
}
updateNavbar();
window.addEventListener("scroll", updateNavbar);

// ---------- Firebase setup ----------
// STEP: Replace this whole block with the config from
// Firebase Console > Project settings > Your apps > astro-kat-web > "Config"
const firebaseConfig = {
  apiKey: "AIzaSyDvcVNVncGlKAnzkd8oNeHI1veBKQKi4ck",
  authDomain: "astro-kat.firebaseapp.com",
  projectId: "astro-kat",
  storageBucket: "astro-kat.firebasestorage.app",
  messagingSenderId: "72480939225",
  appId: "1:72480939225:web:01555cb2701f1bcb9bb2c8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const testimonialsRef = db.collection("testimonials");

// ---------- Testimonials ----------
const testimonialForm = document.getElementById("testimonialForm");
const testimonialStatus = document.getElementById("testimonialStatus");
const testimonialList = document.getElementById("testimonialList");

// Builds one testimonial card. Uses textContent (not innerHTML) so visitors
// can never inject HTML or scripts into the website.
function buildTestimonialCard(name, message) {
  const card = document.createElement("div");
  card.className = "testimonial";

  const quote = document.createElement("p");
  quote.textContent = "\u201C" + message + "\u201D";

  const author = document.createElement("p");
  author.className = "name";
  author.textContent = "- " + name;

  card.appendChild(quote);
  card.appendChild(author);
  return card;
}

function showListMessage(text) {
  testimonialList.innerHTML = "";
  const note = document.createElement("p");
  note.className = "section-sub";
  note.textContent = text;
  testimonialList.appendChild(note);
}

// Loads approved testimonials from the cloud every time the page opens.
async function loadTestimonials() {
  showListMessage("Loading testimonials...");

  try {
    const snapshot = await testimonialsRef
      .where("approved", "==", true)
      .limit(100)
      .get();

    if (snapshot.empty) {
      showListMessage("No testimonials yet. Be the first to share your experience!");
      return;
    }

    // Newest first
    const items = snapshot.docs
      .map(function (doc) { return doc.data(); })
      .sort(function (a, b) {
        const aTime = a.createdAt ? a.createdAt.seconds : 0;
        const bTime = b.createdAt ? b.createdAt.seconds : 0;
        return bTime - aTime;
      });

    testimonialList.innerHTML = "";
    items.forEach(function (item) {
      testimonialList.appendChild(buildTestimonialCard(item.name, item.message));
    });
  } catch (error) {
    console.error("Could not load testimonials:", error);
    showListMessage("Testimonials are unavailable right now. Please try again later.");
  }
}

loadTestimonials();

// Saves new feedback to the cloud. It appears on the site once approved.
testimonialForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = document.getElementById("feedbackName").value.trim();
  const message = document.getElementById("feedbackMessage").value.trim();
  const submitButton = testimonialForm.querySelector("button[type='submit']");

  if (name === "" || message === "") {
    testimonialStatus.textContent = "Please fill in both fields.";
    return;
  }

  if (message.length < 10) {
    testimonialStatus.textContent = "Please write a little more (at least 10 characters).";
    return;
  }

  submitButton.disabled = true;
  testimonialStatus.textContent = "Sending...";

  try {
    await testimonialsRef.add({
      name: name,
      message: message,
      approved: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    testimonialStatus.textContent =
      "Thank you! Your feedback has been received and will appear once it is reviewed.";
    testimonialForm.reset();
  } catch (error) {
    console.error("Could not save feedback:", error);
    testimonialStatus.textContent =
      "Sorry, something went wrong. Please try again in a moment.";
  } finally {
    submitButton.disabled = false;
  }
  
});

