document.addEventListener('DOMContentLoaded', () => {
    const conversationList = document.querySelector('.conversation-list');
    const conversationDetails = document.querySelector('.conversation-details');
    let activePhoneNumber = null; // Track the active conversation phone number

    function setActiveConversation(conversationItem) {
        const allConversationItems = conversationList.querySelectorAll('.conversation-item');
        allConversationItems.forEach(item => item.classList.remove('active'));
        conversationItem.classList.add('active');
        conversationItem.classList.remove('unread');
        activePhoneNumber = conversationItem.dataset.phoneNumber; // Set the active phone number
    }

    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    if (!accessToken) {
        window.location.href = "index.html";
        return;
    }

    console.log('Access Token:', accessToken);
    console.log('User ID:', userId);

    async function fetchMessages() {
        try {
            const response = await fetch('http://68.183.112.242/api/message/showallmessages', {
                headers: {
                    'Authorization': accessToken
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }

            const data = await response.json();
            console.log('Fetched Data:', data);
            console.log('All Conversations:', data.data);

            const userConversations = data.data.filter(conversation => conversation.user_id.toString() === userId.toString());
            console.log('Filtered User Conversations:', userConversations);

            const groupedConversations = groupConversationsByPhoneNumber(userConversations);
            console.log('Grouped Conversations:', groupedConversations);

            displayConversationItems(groupedConversations);

            // Update conversation details if an active conversation is being displayed
            if (activePhoneNumber && groupedConversations[activePhoneNumber]) {
                displayConversationDetails(activePhoneNumber, groupedConversations[activePhoneNumber]);
            }
        } catch (error) {
            console.error('Error fetching conversation data:', error);
        }
    }

    // Normalize phone number
    function normalizePhoneNumber(phoneNumber) {
        phoneNumber = phoneNumber.replace(/\D/g, ''); // Remove non-numeric characters
        if (phoneNumber.length > 10) {
            phoneNumber = phoneNumber.slice(-10); // Take the last 10 digits
        }
        return phoneNumber;
    }

    // Group conversations by phone number
    function groupConversationsByPhoneNumber(conversations) {
        const grouped = {};
        conversations.forEach(conversation => {
            const phoneNumber = normalizePhoneNumber(conversation.recipient);
            if (!grouped[phoneNumber]) {
                grouped[phoneNumber] = [];
            }
            grouped[phoneNumber].push(conversation);
        });
        return grouped;
    }

    // Display conversation items in the list
    function displayConversationItems(groupedConversations) {
        conversationList.innerHTML = ''; // Clear the list to avoid duplicates
        for (const phoneNumber in groupedConversations) {
            const conversations = groupedConversations[phoneNumber];
            const latestConversation = conversations[conversations.length - 1]; 

            const conversationItem = document.createElement('div');
            conversationItem.classList.add('conversation-item');
            if (!latestConversation.read) {
                conversationItem.classList.add('unread');
            }
            conversationItem.innerHTML = `
                <div class="avatar">
                    <img src="https://www.w3schools.com/howto/img_avatar.png" alt="Avatar">
                </div>
                <div class="info">
                    <div class="name">${latestConversation.recipient}</div>
                    <div class="preview">${latestConversation.content}</div>
                    <div class="timestamp">${latestConversation.created_at}</div>
                </div>
            `;
            conversationItem.dataset.phoneNumber = phoneNumber;
            conversationItem.addEventListener('click', () => {
                setActiveConversation(conversationItem);
                displayConversationDetails(phoneNumber, groupedConversations[phoneNumber]);
            });

            conversationList.appendChild(conversationItem); 
        }
    }

    // Function to normalize addresses for Zillow URL
    function normalizeAddressForZillow(address) {
        return address.replace(/\s+/g, '-');
    }

    // Function to convert addresses to clickable links
    function convertAddressesToLinks(text) {
        const addressRegex = /\b\d{1,5}\s+\w+(\s+\w+){1,}\s+\w+\s+\w+\s+\d{5}\b/g;
        return text.replace(addressRegex, (match) => {
            console.log('Detected address:', match); // Log detected addresses
            const zillowAddress = normalizeAddressForZillow(match);
            const zillowUrl = `https://www.zillow.com/homedetails/${zillowAddress}_zpid/`;
            console.log('Zillow URL:', zillowUrl); // Log generated Zillow URL
            return `<a href="${zillowUrl}" target="_blank">${match}</a>`;
        });
    }

    // Function to display conversation details
    function displayConversationDetails(phoneNumber, conversations) {
        conversationDetails.innerHTML = ''; 

        const recipientInfo = document.createElement('div');
        recipientInfo.classList.add('recipient-info');
        recipientInfo.textContent = `Phone Number: ${phoneNumber}`;
        conversationDetails.appendChild(recipientInfo);

        conversations.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        conversations.forEach(message => {
            if (message.status === 'delivered' || message.status === 'received') {
                const messageElement = document.createElement('div');
                messageElement.classList.add('message', message.status);
                messageElement.innerHTML = convertAddressesToLinks(message.content); // Use innerHTML to render links
                conversationDetails.appendChild(messageElement);
            }
        });
    }

    // Group messages by status
    function groupMessagesByStatus(conversations) {
        const grouped = {
            delivered: [],
            received: []
        };
        conversations.forEach(message => {
            if (message.status === 'delivered') {
                grouped.delivered.push(message);
            } else if (message.status === 'received') {
                grouped.received.push(message);
            }
        });
        return grouped;
    }

    const campaignButton = document.getElementById('campaignButton');
    campaignButton.addEventListener('click', () => {
        window.location.href = 'campaign.html';
    });

    // Initial fetch of messages
    fetchMessages();

    // Fetch messages every 5 seconds
    setInterval(fetchMessages, 5000);
});
