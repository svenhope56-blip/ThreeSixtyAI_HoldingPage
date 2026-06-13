import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const waitlistForm = document.getElementById('waitlist-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const formError = document.getElementById('form-error');
    
    const waitlistCard = document.getElementById('waitlist-card');
    const successCard = document.getElementById('success-card');
    const resetBtn = document.getElementById('reset-btn');
    
    const successUserName = document.getElementById('success-user-name');
    const successUserCompany = document.getElementById('success-user-company');
    const successUserEmail = document.getElementById('success-user-email');
    
    const chatBody = document.getElementById('chat-body');
    let currentDocId = null;



    // 1. Simulated Conversational Chat Mockup
    const chatDialogue = [
        { sender: 'agent', text: "Hi Sarah. I'm CARA, your ThreeSixtyAI feedback assistant. Rather than boring 1-to-5 surveys, let's talk about team dynamics. Can you share a recent moment where your team collaborated exceptionally well?" },
        { sender: 'user', text: "Yes! Last month during the system integration, our junior engineer, Alex, stayed late to help resolve a critical database block. It made us all feel supported." },
        { sender: 'agent', text: "That's a strong example of proactive collaboration. What resources or goals could help Alex build on this leadership potential in his PDP?" },
        { sender: 'user', text: "Honestly, giving him dedicated time for a tech lead mentorship program would be perfect. He's ready for it." },
        { sender: 'agent', text: "Got it. I'll synthesise this into a personalised growth recommendation, keeping your comments completely anonymous. Thank you!" }
    ];

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function appendChatBubble(sender, text) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble bubble-${sender}`;
        
        if (sender === 'agent') {
            bubble.innerHTML = `<strong>CARA (AI Agent):</strong> ${text}`;
        } else {
            bubble.innerHTML = `<strong>Sarah (Employee):</strong> ${text}`;
        }
        
        chatBody.appendChild(bubble);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    async function runChatSimulation() {
        chatBody.innerHTML = '';
        for (const message of chatDialogue) {
            await sleep(1500);
            await appendChatBubble(message.sender, message.text);
            await sleep(2000);
        }
        await sleep(10000);
        runChatSimulation();
    }

    // Start simulation
    runChatSimulation();

    const teamSizeSelect = document.getElementById('teamSize');
    const companyDescInput = document.getElementById('companyDesc');

    // 2. Form Submission Handling
    waitlistForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Hide previous errors
        formError.classList.add('hidden');
        formError.innerText = '';

        // Form Fields
        const name = document.getElementById('name').value.trim();
        const company = document.getElementById('company').value.trim();
        const role = document.getElementById('role').value.trim();
        const email = document.getElementById('email').value.trim();
        const agree = document.getElementById('agree').checked;
        
        // Front-end Validation
        if (!name || name.length < 2) {
            showError('Please enter your full name (minimum 2 characters).');
            return;
        }
        if (!company || company.length < 2) {
            showError('Please enter your company name.');
            return;
        }
        if (!role || role.length < 2) {
            showError('Please enter your job title/role.');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            showError('Please enter a valid corporate email address.');
            return;
        }

        if (!agree) {
            showError('You must agree to the preview terms before registering.');
            return;
        }

        // Show loading state
        setLoading(true);

        try {
            // Write directly to Firebase Firestore
            const docRef = await addDoc(collection(db, "registrations"), {
                name: name,
                company: company,
                role: role,
                email: email.toLowerCase(),
                registeredAt: new Date().toISOString()
            });

            // Save doc ID for optional success screen update
            currentDocId = docRef.id;



            // Success State
            successUserName.innerText = name;
            successUserCompany.innerText = company;
            successUserEmail.innerText = email;
            
            // Toggle Cards
            waitlistCard.classList.add('hidden');
            successCard.classList.remove('hidden');

            // Reset form fields
            waitlistForm.reset();

        } catch (error) {
            console.error('Firebase submission error:', error);
            showError('Could not save your registration. Please ensure your Firestore security rules are configured and try again.');
        } finally {
            setLoading(false);
        }
    });

    // Optional details submit logic on success card
    const voluntarySuccessForm = document.getElementById('voluntary-success-form');
    const voluntaryContainer = document.getElementById('voluntary-success-container');
    const voluntaryThanks = document.getElementById('voluntary-thanks-container');
    const submitVoluntaryBtn = document.getElementById('submit-voluntary-btn');

    voluntarySuccessForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const teamSize = teamSizeSelect.value;
        const companyDesc = companyDescInput.value.trim();

        // Omit if both are empty
        if (!teamSize && !companyDesc) {
            voluntaryContainer.classList.add('hidden');
            return;
        }

        // Show loading in secondary button
        submitVoluntaryBtn.disabled = true;
        submitVoluntaryBtn.querySelector('.btn-text').classList.add('hidden');
        submitVoluntaryBtn.querySelector('.btn-loader').classList.remove('hidden');

        try {
            if (currentDocId) {
                // Update Firestore document securely
                await updateDoc(doc(db, "registrations", currentDocId), {
                    teamSize: teamSize || null,
                    companyDesc: companyDesc || null
                });
            }
            
            // Hide voluntary inputs and show thanks message
            voluntaryContainer.classList.add('hidden');
            voluntaryThanks.classList.remove('hidden');
        } catch (error) {
            console.error('Error updating document:', error);
            // Fail gracefully so as not to block user flow
            voluntaryContainer.classList.add('hidden');
            voluntaryThanks.classList.remove('hidden');
        }
    });

    // Reset Success Card to Form Card
    resetBtn.addEventListener('click', () => {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        
        // Clear optional inputs
        teamSizeSelect.value = '';
        companyDescInput.value = '';
        currentDocId = null;

        // Restore voluntary container states
        voluntaryContainer.classList.remove('hidden');
        voluntaryThanks.classList.add('hidden');
        
        // Reset loader in voluntary button
        submitVoluntaryBtn.disabled = false;
        submitVoluntaryBtn.querySelector('.btn-text').classList.remove('hidden');
        submitVoluntaryBtn.querySelector('.btn-loader').classList.add('hidden');
        
        successCard.classList.add('hidden');
        waitlistCard.classList.remove('hidden');
    });

    // Privacy Policy Modal Logic
    const privacyLink = document.getElementById('privacy-link');
    const privacyModal = document.getElementById('privacy-modal');
    const modalClose = document.getElementById('modal-close');

    privacyLink.addEventListener('click', (e) => {
        e.preventDefault();
        privacyModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Disable background scrolling
    });

    const closeModal = () => {
        privacyModal.classList.add('hidden');
        document.body.style.overflow = ''; // Enable background scrolling
    };

    modalClose.addEventListener('click', closeModal);

    privacyModal.addEventListener('click', (e) => {
        if (e.target === privacyModal) {
            closeModal();
        }
    });

    // Preview Terms Modal Logic
    const termsLink = document.getElementById('terms-link');
    const termsModal = document.getElementById('terms-modal');
    const termsClose = document.getElementById('terms-close');

    termsLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent checking the checkbox when clicking the link
        termsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Disable background scrolling
    });

    const closeTermsModal = () => {
        termsModal.classList.add('hidden');
        document.body.style.overflow = ''; // Enable background scrolling
    };

    termsClose.addEventListener('click', closeTermsModal);

    termsModal.addEventListener('click', (e) => {
        if (e.target === termsModal) {
            closeTermsModal();
        }
    });

    // Helper functions
    function showError(message) {
        formError.innerText = message;
        formError.classList.remove('hidden');
        formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
        } else {
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    }
});
