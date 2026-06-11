# Real-Time Communication App

A full-stack real-time collaboration platform that combines video conferencing, messaging, screen sharing, collaborative whiteboarding, and file sharing in a single web application.

The project leverages WebRTC for peer-to-peer media communication, Socket.io for real-time signaling and collaboration events, and Node.js with Express.js for backend services and authentication.

---

**Project Objective**

To provide a secure and interactive communication platform that enables users to create or join virtual meeting rooms, collaborate through live video and audio communication, share screens, exchange files, and work together on a synchronized whiteboard.

---

**Core Features**

Video Conferencing

* Peer-to-peer video and audio communication
* Multi-user meeting rooms
* Dynamic participant video grid
* Camera and microphone controls

Screen Sharing

* Real-time screen sharing using WebRTC
* Seamless switching between camera and screen streams
* Live stream updates for all participants

Real-Time Messaging

* Instant room-based chat
* Socket.io powered communication
* Message broadcasting with minimal latency

Collaborative Whiteboard

* Shared drawing canvas
* Multiple drawing tools
* Real-time synchronization
* Clear board and drawing controls

File Sharing

* Upload and download files within meeting rooms
* Shared file list for participants
* Room-based file organization

Authentication

* User registration and login
* Password hashing using bcrypt
* JWT-based session management
* Protected API endpoints

---

**Technology Stack**

Frontend

* HTML5
* CSS3
* JavaScript (Vanilla)

Backend

* Node.js
* Express.js

Real-Time Communication

* Socket.io
* WebRTC

Authentication & Security

* JWT
* bcrypt
* Helmet.js

Storage

* LowDB (JSON Database)
* Local File Storage

---

**System Architecture**

Client browsers establish direct peer-to-peer media connections using WebRTC.

Socket.io is responsible for:

* Room management
* Signaling exchange
* Chat synchronization
* Whiteboard synchronization
* File-sharing notifications

Express.js handles:

* Authentication APIs
* File management APIs
* User management
* Security middleware

---

**Project Structure**

```text
Task_2/
├── server/
│   ├── server.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── files.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   └── Room.js
│   ├── uploads/
│   └── .env
│
├── public/
│   ├── index.html
│   ├── room.html
│   ├── css/
│   │   ├── main.css
│   │   └── room.css
│   └── js/
│       ├── auth.js
│       ├── room.js
│       ├── whiteboard.js
│       └── fileShare.js
│
├── package.json
└── README.md
```

---

**Security Measures**

* JWT authentication
* Password hashing using bcrypt
* HTTPS support
* Secure WebRTC media encryption (DTLS-SRTP)
* Helmet.js security headers
* Protected API routes
* File upload validation
* File size restrictions

---

**WebRTC Configuration**

STUN Server:

```text
stun:stun.l.google.com:19302
```

The application uses a mesh topology where participants connect directly to one another, supporting small-group meetings efficiently.

Recommended room size:

* Up to 6 participants



**Implemented Modules**

* User Authentication
* Room Management
* Video Calling
* Audio Communication
* Screen Sharing
* Live Chat
* Collaborative Whiteboard
* File Sharing
* Secure API Layer



**Testing Workflow**

1. Register multiple users.
2. Create a meeting room.
3. Join the room from separate browsers.
4. Verify audio and video communication.
5. Test screen sharing.
6. Exchange chat messages.
7. Draw on the collaborative whiteboard.
8. Upload and download files.
9. Leave and rejoin the room.


**Future Enhancements**

* TURN Server Integration
* Meeting Recording
* Chat Persistence
* Admin Controls
* Mobile Support
* End-to-End Chat Encryption
* Cloud Storage Integration
* Participant Moderation Tools
* Scalable SFU Architecture



**Learning Outcomes**

This project demonstrates practical implementation of:

* WebRTC Signaling and Peer Connections
* Real-Time Event-Driven Systems
* Socket.io Communication
* Authentication and Authorization
* Secure File Handling
* Collaborative Application Design
* Frontend and Backend Integration
* Network Communication Protocols



Developed as a full-stack real-time communication and collaboration platform using WebRTC, Socket.io, Express.js, and modern web technologies.
