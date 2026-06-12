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

    // 1. Simulated Conversational Chat Mockup
    const chatDialogue = [
        { sender: 'agent', text: "Hi Sarah. I'm your ThreeSixtyAI feedback coordinator. Rather than boring 1-to-5 surveys, let's talk about team dynamics. Can you share a recent moment where your team collaborated exceptionally well?" },
        { sender: 'user', text: "Yes! Last month during the system integration, our junior engineer, Alex, stayed late to help resolve a critical database block. It made us all feel supported." },
        { sender: 'agent', text: "That's a strong example of proactive collaboration. What resources or goals could help Alex build on this leadership potential in his PDP?" },
        { sender: 'user', text: "Honestly, giving him dedicated time for a tech-lead mentorship program would be perfect. He's ready for it." },
        { sender: 'agent', text: "Got it. I'll synthesize this into a personalized growth recommendation, keeping your comments completely anonymous. Thank you!" }
    ];

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function appendChatBubble(sender, text) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble bubble-${sender}`;
        
        if (sender === 'agent') {
            bubble.innerHTML = `<strong>ThreeSixtyAI Agent:</strong> ${text}`;
        } else {
            bubble.innerHTML = `<strong>Sarah (Employee):</strong> ${text}`;
        }
        
        chatBody.appendChild(bubble);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    async function runChatSimulation() {
        chatBody.innerHTML = '';
        for (const message of chatDialogue) {
            // Typing indicator delay
            await sleep(1500);
            await appendChatBubble(message.sender, message.text);
            await sleep(2000);
        }
        
        // Loop simulation every 10 seconds after completion
        await sleep(10000);
        runChatSimulation();
    }

    // Start simulation
    runChatSimulation();

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
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, company, role, email })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Something went wrong. Please try again.');
            }

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
            showError(error.message);
        } finally {
            setLoading(false);
        }
    });

    // Reset Success Card to Form Card
    resetBtn.addEventListener('click', () => {
        successCard.classList.add('hidden');
        waitlistCard.classList.remove('hidden');
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
