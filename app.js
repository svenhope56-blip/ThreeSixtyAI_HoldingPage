import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    const waitlistForm = document.getElementById('waitlist-form');
    const submitBtn = document.getElementById('submit-btn');
    const formInnerWrap = document.getElementById('form-inner-wrap');
    const formError = document.getElementById('form-error');
    
    const successCard = document.getElementById('success-card');
    const resetBtn = document.getElementById('reset-btn');
    const successUserName = document.getElementById('success-user-name');
    const successUserEmail = document.getElementById('success-user-email');

    // 1. Form Submission Handling
    if (waitlistForm) {
        waitlistForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (formError) {
                formError.classList.add('hidden');
                formError.innerText = '';
            }

            const name = document.getElementById('name')?.value.trim();
            const company = document.getElementById('company')?.value.trim();
            const role = document.getElementById('role')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const agree = document.getElementById('agree')?.checked;
            
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
                showError('You must agree to the Terms and Privacy Policy.');
                return;
            }

            setLoading(true);

            try {
                await addDoc(collection(db, "registrations"), {
                    name: name,
                    company: company,
                    role: role,
                    email: email.toLowerCase(),
                    registeredAt: new Date().toISOString()
                });

                if (successUserName) successUserName.innerText = name;
                if (successUserEmail) successUserEmail.innerText = email;
                
                if (formInnerWrap) formInnerWrap.classList.add('hidden');
                if (successCard) successCard.classList.remove('hidden');

                waitlistForm.reset();
            } catch (error) {
                console.error('Firebase error:', error);
                showError('Could not save registration. Please check your connection and try again.');
            } finally {
                setLoading(false);
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (successCard) successCard.classList.add('hidden');
            if (formInnerWrap) formInnerWrap.classList.remove('hidden');
        });
    }

    // Modal Helpers
    function setupModal(triggerId, modalId, closeId) {
        const trigger = document.getElementById(triggerId);
        const modal = document.getElementById(modalId);
        const close = document.getElementById(closeId);

        if (trigger && modal) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                modal.classList.remove('hidden');
            });
        }

        if (close && modal) {
            close.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        }
    }

    setupModal('link-terms', 'terms-modal', 'close-terms-btn');
    setupModal('footer-terms', 'terms-modal', 'close-terms-btn');
    setupModal('link-privacy', 'privacy-modal', 'close-privacy-btn');
    setupModal('footer-privacy', 'privacy-modal', 'close-privacy-btn');

    function showError(message) {
        if (!formError) return;
        formError.innerText = message;
        formError.classList.remove('hidden');
    }

    function setLoading(isLoading) {
        if (!submitBtn) return;
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');

        if (isLoading) {
            submitBtn.disabled = true;
            if (btnText) btnText.classList.add('hidden');
            if (btnLoader) btnLoader.classList.remove('hidden');
        } else {
            submitBtn.disabled = false;
            if (btnText) btnText.classList.remove('hidden');
            if (btnLoader) btnLoader.classList.add('hidden');
        }
    }
});
