document.addEventListener("DOMContentLoaded", () => {
  // Add this helper function at the beginning of the script
  function safeQuerySelector(selector) {
    const element = document.querySelector(selector)
    return element || null
  }

  // Theme toggle functionality
  const themeToggleBtn = document.getElementById("theme-toggle-btn")
  const body = document.body
  const robotHead = document.querySelector(".robot-head")

  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem("theme")
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    body.classList.add("dark")
    themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>'
  }

  themeToggleBtn.addEventListener("click", () => {
    body.classList.toggle("dark")

    if (body.classList.contains("dark")) {
      localStorage.setItem("theme", "dark")
      themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>'

      // Animate robot when switching to dark mode
      animateRobotThemeChange(true)
    } else {
      localStorage.setItem("theme", "light")
      themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>'

      // Animate robot when switching to light mode
      animateRobotThemeChange(false)
    }
  })

  // Robot animation for theme change
  function animateRobotThemeChange(isDark) {
    const robot = document.querySelector(".robot-container")
    const robotHead = document.querySelector(".robot-head")
    const robotEyes = document.querySelectorAll(".robot-eye")

    // Rotate the robot head
    if (robotHead) {
      robotHead.style.transform = "rotate(360deg)"
      setTimeout(() => {
        robotHead.style.transform = "rotate(0)"
      }, 500)
    }

    // Make the robot jump
    if (robot) {
      robot.classList.add("jump")
      setTimeout(() => {
        robot.classList.remove("jump")
      }, 500)
    }

    // Change eye color briefly
    robotEyes.forEach((eye) => {
      const originalColor = window.getComputedStyle(eye).backgroundColor
      eye.style.backgroundColor = isDark ? "#818cf8" : "#6366f1"
      setTimeout(() => {
        eye.style.backgroundColor = originalColor
      }, 500)
    })
  }

  // Tab switching with animation
  const tabBtns = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab")

      // Remove active class from all tabs
      tabBtns.forEach((b) => b.classList.remove("active"))

      // Hide all tab contents with fade out
      tabContents.forEach((content) => {
        if (content.classList.contains("active")) {
          content.style.opacity = "0"
          content.style.transform = "translateY(10px)"
          setTimeout(() => {
            content.classList.remove("active")
            content.style.opacity = ""
            content.style.transform = ""
          }, 200)
        }
      })

      // Add active class to selected tab
      btn.classList.add("active")

      // Show selected tab content with delay for animation
      setTimeout(() => {
        document.getElementById(`${tabId}-tab`).classList.add("active")
      }, 210)

      // Animate robot when changing tabs
      animateRobotTabChange(tabId)
    })
  })

  // Robot animation for tab change
  function animateRobotTabChange(tabId) {
    const robotMouth = document.querySelector(".robot-mouth")

    if (!robotMouth) return

    // Remove all animation classes first
    robotMouth.classList.remove("fast-talk", "normal-talk", "error")

    // Change mouth animation based on tab
    if (tabId === "voice") {
      robotMouth.style.animation = "talk 0.5s 3"
      setTimeout(() => {
        robotMouth.classList.add("normal-talk")
        robotMouth.style.animation = ""
      }, 1500)
    } else if (tabId === "text") {
      robotMouth.style.animation = "none"
      robotMouth.style.height = "3px"
      robotMouth.style.width = "20px"
      setTimeout(() => {
        robotMouth.classList.add("normal-talk")
        robotMouth.style.animation = ""
        robotMouth.style.width = ""
        robotMouth.style.height = ""
      }, 500)
    } else if (tabId === "history") {
      robotMouth.style.animation = "none"
      robotMouth.style.height = "3px"
      robotMouth.style.width = "10px"
      setTimeout(() => {
        robotMouth.style.width = "20px"
        setTimeout(() => {
          robotMouth.classList.add("normal-talk")
          robotMouth.style.animation = ""
          robotMouth.style.width = ""
          robotMouth.style.height = ""
        }, 300)
      }, 300)
    }
  }

  // Audio recording functionality
  let mediaRecorder
  let audioChunks = []
  let audioBlob
  let isRecording = false

  const recordBtn = document.getElementById("record-btn")
  const recordingStatus = document.getElementById("recording-status")
  const audioPlayerContainer = document.getElementById("audio-player-container")
  const audioPlayer = document.getElementById("audio-player")
  const voiceGenerateBtn = document.getElementById("voice-generate-btn")

  recordBtn.addEventListener("click", toggleRecording)

  function toggleRecording() {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder = new MediaRecorder(stream)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        audioBlob = new Blob(audioChunks, { type: "audio/wav" })
        const audioUrl = URL.createObjectURL(audioBlob)
        audioPlayer.src = audioUrl
        audioPlayerContainer.classList.remove("hidden")
        voiceGenerateBtn.disabled = false

        // Add animation to audio player
        audioPlayerContainer.style.opacity = "0"
        audioPlayerContainer.style.transform = "translateY(10px)"
        setTimeout(() => {
          audioPlayerContainer.style.opacity = "1"
          audioPlayerContainer.style.transform = "translateY(0)"
          audioPlayerContainer.style.transition = "opacity 0.3s ease, transform 0.3s ease"
        }, 10)

        // Show robot recording stopped animation
        recordingStatus.innerHTML = `
          <div class="robot-success">
            <div class="robot-success-circle"></div>
            <div class="robot-success-check">✓</div>
          </div>
          <div>Recording stopped. Ready to generate image.</div>
        `

        // Animate robot
        const robotMouth = document.querySelector(".robot-mouth")
        if (robotMouth) {
          robotMouth.classList.remove("fast-talk", "normal-talk", "error")
          robotMouth.style.animation = "none"
          robotMouth.style.height = "8px"
          robotMouth.style.width = "20px"
          robotMouth.style.borderRadius = "4px"
          setTimeout(() => {
            robotMouth.classList.add("normal-talk")
            robotMouth.style.animation = ""
            robotMouth.style.height = ""
            robotMouth.style.width = ""
            robotMouth.style.borderRadius = ""
          }, 1000)
        }
      }

      audioChunks = []
      mediaRecorder.start()
      isRecording = true

      recordBtn.classList.add("recording")
      recordBtn.innerHTML = '<i class="fas fa-stop"></i><span>Stop Recording</span>'

      // Show robot recording animation
      recordingStatus.innerHTML = `
        <div class="robot-recording">
          <div class="robot-recording-circle"></div>
          <div class="robot-recording-circle"></div>
          <div class="robot-recording-circle"></div>
          <div class="robot-recording-mic">
            <i class="fas fa-microphone"></i>
          </div>
        </div>
        <div>Recording in progress...</div>
      `

      // Animate robot
      const robotMouth = document.querySelector(".robot-mouth")
      if (robotMouth) {
        robotMouth.classList.remove("fast-talk", "normal-talk", "error")
        robotMouth.classList.add("fast-talk")
      }
    } catch (err) {
      console.error("Error accessing microphone:", err)

      // Show error message with robot animation
      recordingStatus.innerHTML = `
        <div class="robot-error">
          <div class="robot-error-circle"></div>
          <div class="robot-error-x">✕</div>
        </div>
        <div>Error: Could not access microphone</div>
      `

      // Animate robot to show error
      const robotMouth = document.querySelector(".robot-mouth")
      if (robotMouth) {
        robotMouth.classList.remove("fast-talk", "normal-talk", "error")
        robotMouth.style.animation = "none"
        robotMouth.style.height = "2px"
        robotMouth.style.width = "15px"
        robotMouth.style.transform = "rotate(180deg)"
        setTimeout(() => {
          robotMouth.classList.add("normal-talk")
          robotMouth.style.animation = ""
          robotMouth.style.height = ""
          robotMouth.style.width = ""
          robotMouth.style.transform = ""
        }, 2000)
      }
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop()

      // Stop all audio tracks
      mediaRecorder.stream.getTracks().forEach((track) => track.stop())

      isRecording = false
      recordBtn.classList.remove("recording")
      recordBtn.innerHTML = '<i class="fas fa-microphone"></i><span>Start Recording</span>'
    }
  }

  // Voice generation with improved feedback and robot animations
  voiceGenerateBtn.addEventListener("click", async () => {
    if (!audioBlob) {
      return
    }

    const voiceImageContainer = document.getElementById("voice-image-container")
    const transcriptionOutput = document.getElementById("transcription-output")
    const dallePromptOutput = document.getElementById("dalle-prompt-output")
    const voiceDownloadBtn = document.getElementById("voice-download-btn")
    const voiceShareBtn = document.getElementById("voice-share-btn")
    const voiceStatusMessage = document.getElementById("voice-status-message")
    const voiceStyle = document.getElementById("voice-style").value
    const robotTyping = document.querySelector(".robot-typing")

    // Show loading state with robot animation
    voiceImageContainer.innerHTML = `
      <div class="robot-loading">
        <div class="robot-processing">
          <div class="robot-processing-circle"></div>
          <div class="robot-processing-circle"></div>
          <div class="robot-processing-circle"></div>
        </div>
        <div class="robot-loading-text">Generating image...</div>
      </div>
    `

    voiceStatusMessage.textContent = "Transcribing audio..."
    voiceStatusMessage.style.color = "var(--primary-color)"
    voiceGenerateBtn.disabled = true

    // Show robot typing animation
    if (robotTyping) {
      robotTyping.style.display = "flex"
    }

    // Animate robot
    const robotMouth = document.querySelector(".robot-mouth")
    if (robotMouth) {
      robotMouth.classList.remove("fast-talk", "normal-talk", "error")
      robotMouth.classList.add("fast-talk")
    }

    // Animate robot antenna
    const robotAntenna = safeQuerySelector(".robot-antenna")
    if (robotAntenna) {
      robotAntenna.classList.add("fast-pulse")
    }

    try {
      // First, transcribe the audio
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.wav")

      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!transcribeResponse.ok) {
        throw new Error("Failed to transcribe audio")
      }

      const transcribeData = await transcribeResponse.json()

      // Animate the transcription appearing
      transcriptionOutput.value = ""
      const transcription = transcribeData.transcription
      let i = 0
      const typeWriter = () => {
        if (i < transcription.length) {
          transcriptionOutput.value += transcription.charAt(i)
          i++
          setTimeout(typeWriter, 10)
        }
      }
      typeWriter()

      voiceStatusMessage.textContent = "Generating image..."

      // Update robot typing text
      if (document.querySelector(".robot-typing-text")) {
        document.querySelector(".robot-typing-text").innerHTML =
          "Creating image<span class='robot-typing-cursor'></span>"
      }

      // Now generate the image
      const generateResponse = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcription: transcribeData.transcription,
          style: voiceStyle,
        }),
      })

      if (!generateResponse.ok) {
        throw new Error("Failed to generate image")
      }

      const generateData = await generateResponse.json()

      // Animate the DALL-E prompt appearing
      dallePromptOutput.value = ""
      const dallePrompt = generateData.dalle_prompt
      let j = 0
      const typeWriterDalle = () => {
        if (j < dallePrompt.length) {
          dallePromptOutput.value += dallePrompt.charAt(j)
          j++
          setTimeout(typeWriterDalle, 5)
        } else {
          // Hide robot typing animation when done
          if (robotTyping) {
            robotTyping.style.display = "none"
          }
        }
      }
      typeWriterDalle()

      // Display the image with fade-in animation
      const img = new Image()
      img.src = generateData.local_image_path
      img.alt = "Generated image"
      img.style.opacity = "0"
      img.style.transition = "opacity 0.5s ease"

      img.onload = () => {
        voiceImageContainer.innerHTML = ""
        voiceImageContainer.appendChild(img)
        setTimeout(() => {
          img.style.opacity = "1"
        }, 100)

        // Show success animation after image loads
        voiceStatusMessage.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="robot-success" style="width: 20px; height: 20px;">
              <div class="robot-success-circle"></div>
              <div class="robot-success-check">✓</div>
            </div>
            <span>Image generated successfully!</span>
          </div>
        `
      }

      // Enable download and share buttons with animation
      voiceDownloadBtn.disabled = false
      voiceShareBtn.disabled = false
      voiceDownloadBtn.setAttribute("data-id", generateData.id)
      voiceShareBtn.setAttribute("data-id", generateData.id)

      // Add a subtle animation to the buttons
      voiceDownloadBtn.style.transform = "scale(0.95)"
      voiceShareBtn.style.transform = "scale(0.95)"
      setTimeout(() => {
        voiceDownloadBtn.style.transition = "transform 0.3s ease"
        voiceShareBtn.style.transition = "transform 0.3s ease"
        voiceDownloadBtn.style.transform = "scale(1)"
        voiceShareBtn.style.transform = "scale(1)"
      }, 100)

      voiceStatusMessage.style.color = "var(--success-color)"
      voiceGenerateBtn.disabled = false

      // Reset robot animations
      if (robotMouth) {
        robotMouth.classList.remove("fast-talk", "error")
        robotMouth.classList.add("normal-talk")
      }
      const robotAntenna = safeQuerySelector(".robot-antenna")
      if (robotAntenna) {
        robotAntenna.classList.remove("fast-pulse")
        robotAntenna.classList.add("normal-pulse")
      }
    } catch (error) {
      console.error("Error:", error)

      // Show error with robot animation
      voiceStatusMessage.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="robot-error" style="width: 20px; height: 20px;">
            <div class="robot-error-circle"></div>
            <div class="robot-error-x">✕</div>
          </div>
          <span>Error: ${error.message}</span>
        </div>
      `

      voiceStatusMessage.style.color = "var(--danger-color)"
      voiceImageContainer.innerHTML = '<div class="placeholder-text">Error generating image</div>'
      voiceGenerateBtn.disabled = false

      // Hide robot typing animation
      if (robotTyping) {
        robotTyping.style.display = "none"
      }

      // Animate robot to show error
      const robotMouth = document.querySelector(".robot-mouth")
      if (robotMouth) {
        robotMouth.classList.remove("fast-talk", "normal-talk", "error")
        robotMouth.style.animation = "none"
        robotMouth.style.height = "2px"
        robotMouth.style.width = "15px"
        robotMouth.style.transform = "rotate(180deg)"
        setTimeout(() => {
          robotMouth.classList.add("normal-talk")
          robotMouth.style.animation = ""
          robotMouth.style.height = ""
          robotMouth.style.width = ""
          robotMouth.style.transform = ""
        }, 2000)
      }
    }
  })

  // Text generation with improved feedback and robot animations
  const textGenerateBtn = document.getElementById("text-generate-btn")

  textGenerateBtn.addEventListener("click", async () => {
    const textInput = document.getElementById("text-input")
    const textImageContainer = document.getElementById("text-image-container")
    const textDallePrompt = document.getElementById("text-dalle-prompt")
    const textDownloadBtn = document.getElementById("text-download-btn")
    const textShareBtn = document.getElementById("text-share-btn")
    const textStatusMessage = document.getElementById("text-status-message")
    const textStyle = document.getElementById("text-style").value
    const robotTyping = document.querySelectorAll(".robot-typing")[1]

    if (!textInput.value.trim()) {
      textStatusMessage.textContent = "Please enter a description"
      textStatusMessage.style.color = "var(--danger-color)"
      // Add shake animation to the input
      textInput.style.animation = "shake 0.5s"
      setTimeout(() => {
        textInput.style.animation = ""
      }, 500)

      // Animate robot to show error
      const robotMouth = document.querySelector(".robot-mouth")
      if (robotMouth) {
        robotMouth.classList.remove("fast-talk", "normal-talk", "error")
        robotMouth.style.animation = "none"
        robotMouth.style.height = "2px"
        robotMouth.style.width = "15px"
        robotMouth.style.transform = "rotate(180deg)"
        setTimeout(() => {
          robotMouth.classList.add("normal-talk")
          robotMouth.style.animation = ""
          robotMouth.style.height = ""
          robotMouth.style.width = ""
          robotMouth.style.transform = ""
        }, 1000)
      }

      return
    }

    // Show loading state with robot animation
    textImageContainer.innerHTML = `
      <div class="robot-loading">
        <div class="robot-processing">
          <div class="robot-processing-circle"></div>
          <div class="robot-processing-circle"></div>
          <div class="robot-processing-circle"></div>
        </div>
        <div class="robot-loading-text">Generating image...</div>
      </div>
    `

    textStatusMessage.textContent = "Generating image..."
    textStatusMessage.style.color = "var(--primary-color)"
    textGenerateBtn.disabled = true

    // Show robot typing animation
    if (robotTyping) {
      robotTyping.style.display = "flex"
    }

    // Animate robot
    const robotMouth = document.querySelector(".robot-mouth")
    if (robotMouth) {
      robotMouth.classList.remove("fast-talk", "normal-talk", "error")
      robotMouth.classList.add("fast-talk")
    }

    // Animate robot antenna
    const robotAntenna = safeQuerySelector(".robot-antenna")
    if (robotAntenna) {
      robotAntenna.classList.add("fast-pulse")
    }

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textInput.value,
          style: textStyle,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate image")
      }

      const data = await response.json()

      // Animate the DALL-E prompt appearing
      textDallePrompt.value = ""
      const dallePrompt = data.dalle_prompt
      let i = 0
      const typeWriter = () => {
        if (i < dallePrompt.length) {
          textDallePrompt.value += dallePrompt.charAt(i)
          i++
          setTimeout(typeWriter, 5)
        } else {
          // Hide robot typing animation when done
          if (robotTyping) {
            robotTyping.style.display = "none"
          }
        }
      }
      typeWriter()

      // Display the image with fade-in animation
      const img = new Image()
      img.src = data.local_image_path
      img.alt = "Generated image"
      img.style.opacity = "0"
      img.style.transition = "opacity 0.5s ease"

      img.onload = () => {
        textImageContainer.innerHTML = ""
        textImageContainer.appendChild(img)
        setTimeout(() => {
          img.style.opacity = "1"
        }, 100)

        // Show success animation after image loads
        textStatusMessage.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="robot-success" style="width: 20px; height: 20px;">
              <div class="robot-success-circle"></div>
              <div class="robot-success-check">✓</div>
            </div>
            <span>Image generated successfully!</span>
          </div>
        `
      }

      // Enable download and share buttons with animation
      textDownloadBtn.disabled = false
      textShareBtn.disabled = false
      textDownloadBtn.setAttribute("data-id", data.id)
      textShareBtn.setAttribute("data-id", data.id)

      // Add a subtle animation to the buttons
      textDownloadBtn.style.transform = "scale(0.95)"
      textShareBtn.style.transform = "scale(0.95)"
      setTimeout(() => {
        textDownloadBtn.style.transition = "transform 0.3s ease"
        textShareBtn.style.transition = "transform 0.3s ease"
        textDownloadBtn.style.transform = "scale(1)"
        textShareBtn.style.transform = "scale(1)"
      }, 100)

      textStatusMessage.style.color = "var(--success-color)"
      textGenerateBtn.disabled = false

      // Reset robot animations
      if (robotMouth) {
        robotMouth.classList.remove("fast-talk", "error")
        robotMouth.classList.add("normal-talk")
      }
      const robotAntenna = safeQuerySelector(".robot-antenna")
      if (robotAntenna) {
        robotAntenna.classList.remove("fast-pulse")
        robotAntenna.classList.add("normal-pulse")
      }
    } catch (error) {
      console.error("Error:", error)

      // Show error with robot animation
      textStatusMessage.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="robot-error" style="width: 20px; height: 20px;">
            <div class="robot-error-circle"></div>
            <div class="robot-error-x">✕</div>
          </div>
          <span>Error: ${error.message}</span>
        </div>
      `

      textStatusMessage.style.color = "var(--danger-color)"
      textImageContainer.innerHTML = '<div class="placeholder-text">Error generating image</div>'
      textGenerateBtn.disabled = false

      // Hide robot typing animation
      if (robotTyping) {
        robotTyping.style.display = "none"
      }

      // Animate robot to show error
      const robotMouth = document.querySelector(".robot-mouth")
      if (robotMouth) {
        robotMouth.classList.remove("fast-talk", "normal-talk", "error")
        robotMouth.style.animation = "none"
        robotMouth.style.height = "2px"
        robotMouth.style.width = "15px"
        robotMouth.style.transform = "rotate(180deg)"
        setTimeout(() => {
          robotMouth.classList.add("normal-talk")
          robotMouth.style.animation = ""
          robotMouth.style.height = ""
          robotMouth.style.width = ""
          robotMouth.style.transform = ""
        }, 1000)
      }
    }
  })

  // Download functionality with feedback and robot animations
  const voiceDownloadBtn = document.getElementById("voice-download-btn")
  const textDownloadBtn = document.getElementById("text-download-btn")

  voiceDownloadBtn.addEventListener("click", downloadImage)
  textDownloadBtn.addEventListener("click", downloadImage)

  async function downloadImage(event) {
    const generationId = event.target.getAttribute("data-id")
    const statusElement = event.target.closest(".output-column").querySelector(".status-message")

    if (!generationId) {
      statusElement.textContent = "No image to download"
      statusElement.style.color = "var(--danger-color)"
      return
    }

    // Add loading animation to the button
    const originalContent = event.target.innerHTML
    event.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...'
    event.target.disabled = true

    // Animate robot
    const robotMouth = document.querySelector(".robot-mouth")
    if (robotMouth) {
      robotMouth.classList.remove("fast-talk", "normal-talk", "error")
      robotMouth.classList.add("fast-talk")
    }

    try {
      const response = await fetch(`/api/download/${generationId}`)

      if (!response.ok) {
        throw new Error("Failed to get download URL")
      }

      const data = await response.json()

      // Create a temporary link to download the image
      const link = document.createElement("a")
      link.href = data.download_url
      link.download = `ai-image-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Show success animation
      statusElement.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="robot-success" style="width: 20px; height: 20px;">
            <div class="robot-success-circle"></div>
            <div class="robot-success-check">✓</div>
          </div>
          <span>Image downloaded successfully!</span>
        </div>
      `

      statusElement.style.color = "var(--success-color)"

      // Reset button with success icon
      setTimeout(() => {
        event.target.innerHTML = '<i class="fas fa-check"></i> Downloaded'
        setTimeout(() => {
          event.target.innerHTML = originalContent
          event.target.disabled = false
        }, 2000)
      }, 500)

      // Reset robot animation
      if (robotMouth) {
        robotMouth.classList.remove("fast-talk", "error")
        robotMouth.classList.add("normal-talk")
      }
    } catch (error) {
      console.error("Error:", error)

      // Show error with robot animation
      statusElement.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="robot-error" style="width: 20px; height: 20px;">
            <div class="robot-error-circle"></div>
            <div class="robot-error-x">✕</div>
          </div>
          <span>Error: ${error.message}</span>
        </div>
      `

      statusElement.style.color = "var(--danger-color)"

      // Reset button
      event.target.innerHTML = originalContent
      event.target.disabled = false

      // Animate robot to show error
      const robotMouth = document.querySelector(".robot-mouth")
      if (robotMouth) {
        robotMouth.classList.remove("fast-talk", "normal-talk", "error")
        robotMouth.style.animation = "none"
        robotMouth.style.height = "2px"
        robotMouth.style.width = "15px"
        robotMouth.style.transform = "rotate(180deg)"
        setTimeout(() => {
          robotMouth.classList.add("normal-talk")
          robotMouth.style.animation = ""
          robotMouth.style.height = ""
          robotMouth.style.width = ""
          robotMouth.style.transform = ""
        }, 1000)
      }
    }
  }

  // Share functionality with improved modal and robot animations
  const voiceShareBtn = document.getElementById("voice-share-btn")
  const textShareBtn = document.getElementById("text-share-btn")
  const modal = document.getElementById("modal")
  const modalTitle = document.getElementById("modal-title")
  const modalBody = document.getElementById("modal-body")
  const closeBtn = document.querySelector(".close-btn")
  const floatingRobot = document.getElementById("floating-robot")

  voiceShareBtn.addEventListener("click", shareImage)
  textShareBtn.addEventListener("click", shareImage)
  closeBtn.addEventListener("click", () => {
    modal.style.opacity = "0"
    setTimeout(() => {
      modal.classList.remove("active")
    }, 300)
  })

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.opacity = "0"
      setTimeout(() => {
        modal.classList.remove("active")
      }, 300)
    }
  })

  // Floating robot click handler
  floatingRobot.addEventListener("click", () => {
    // Show a fun robot animation
    const robotContainer = document.querySelector(".robot-container")
    const robotEyes = document.querySelectorAll(".robot-eye")
    const robotMouth = document.querySelector(".robot-mouth")

    if (robotContainer) {
      robotContainer.classList.add("jump")
    }

    // Make the robot eyes blink rapidly
    robotEyes.forEach((eye) => {
      eye.classList.add("fast-blink")
    })

    // Make the robot mouth talk rapidly
    if (robotMouth) {
      robotMouth.classList.add("fast-talk")
    }

    // Reset animations after a while
    setTimeout(() => {
      if (robotContainer) {
        robotContainer.classList.remove("jump")
      }

      robotEyes.forEach((eye) => {
        eye.classList.remove("fast-blink")
        eye.classList.add("normal-blink")
      })

      if (robotMouth) {
        robotMouth.classList.remove("fast-talk")
        robotMouth.classList.add("normal-talk")
      }
    }, 3000)
  })

  async function shareImage(event) {
    const generationId = event.target.getAttribute("data-id")
    const statusElement = event.target.closest(".output-column").querySelector(".status-message")

    if (!generationId) {
      statusElement.textContent = "No image to share"
      statusElement.style.color = "var(--danger-color)"
      return
    }

    // Add loading animation to the button
    const originalContent = event.target.innerHTML
    event.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...'
    event.target.disabled = true

    // Animate robot
    const robotMouth = document.querySelector(".robot-mouth")
    if (robotMouth) {
      robotMouth.classList.remove("fast-talk", "normal-talk", "error")
      robotMouth.classList.add("fast-talk")
    }

    try {
      const response = await fetch(`/api/share/${generationId}`)

      if (!response.ok) {
        throw new Error("Failed to get share URL")
      }

      const data = await response.json()

      // Show modal with WhatsApp share link and robot animation
      modalTitle.textContent = "Share to WhatsApp"
      modalBody.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div class="robot-container" style="margin-bottom: 20px;">
            <div class="robot-head">
              <div class="robot-antenna"></div>
              <div class="robot-eye left"></div>
              <div class="robot-eye right"></div>
              <div class="robot-mouth"></div>
            </div>
            <div class="robot-body"></div>
            <div class="robot-arm left"></div>
            <div class="robot-arm right"></div>
          </div>
          <p style="margin-bottom: 20px;">Click the button below to share this image on WhatsApp</p>
          <a href="${data.share_url}" target="_blank" class="whatsapp-share-btn">
            <i class="fab fa-whatsapp"></i> Open WhatsApp
          </a>
        </div>
      `

      modal.classList.add("active")
      modal.style.opacity = "1"

      // Reset button
      event.target.innerHTML = originalContent
      event.target.disabled = false

      // Add styles for the WhatsApp button
      const style = document.createElement("style")
      style.textContent = `
        .whatsapp-share-btn {
          display: inline-block;
          padding: 12px 24px;
          background-color: #25D366;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          transition: all 0.3s ease;
        }
        .whatsapp-share-btn:hover {
          background-color: #1da851;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        body.dark .whatsapp-share-btn {
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
      `
      document.head.appendChild(style)

      // Reset robot animation
      if (robotMouth) {
        robotMouth.classList.remove("fast-talk", "error")
        robotMouth.classList.add("normal-talk")
      }
    } catch (error) {
      console.error("Error:", error)

      // Show error with robot animation
      statusElement.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="robot-error" style="width: 20px; height: 20px;">
            <div class="robot-error-circle"></div>
            <div class="robot-error-x">✕</div>
          </div>
          <span>Error: ${error.message}</span>
        </div>
      `

      statusElement.style.color = "var(--danger-color)"

      // Reset button
      event.target.innerHTML = originalContent
      event.target.disabled = false

      // Animate robot to show error
      const robotMouth = document.querySelector(".robot-mouth")
      if (robotMouth) {
        robotMouth.classList.remove("fast-talk", "normal-talk", "error")
        robotMouth.style.animation = "none"
        robotMouth.style.height = "2px"
        robotMouth.style.width = "15px"
        robotMouth.style.transform = "rotate(180deg)"
        setTimeout(() => {
          robotMouth.classList.add("normal-talk")
          robotMouth.style.animation = ""
          robotMouth.style.height = ""
          robotMouth.style.width = ""
          robotMouth.style.transform = ""
        }, 1000)
      }
    }
  }

  // History functionality with improved animations and robot elements
  const refreshHistoryBtn = document.getElementById("refresh-history-btn")
  const historyContent = document.getElementById("history-content")

  refreshHistoryBtn.addEventListener("click", loadHistory)

  // Load history when the history tab is clicked
  document.querySelector('[data-tab="history"]').addEventListener("click", loadHistory)

  async function loadHistory() {
    historyContent.innerHTML = `
      <div class="robot-loading">
        <div class="robot-processing">
          <div class="robot-processing-circle"></div>
          <div class="robot-processing-circle"></div>
          <div class="robot-processing-circle"></div>
        </div>
        <div class="robot-loading-text">Loading history...</div>
      </div>
    `

    // Animate robot
    const robotMouth = document.querySelector(".robot-mouth")
    if (robotMouth) {
      robotMouth.classList.remove("fast-talk", "normal-talk", "error")
      robotMouth.classList.add("fast-talk")
    }

    try {
      const response = await fetch("/api/history")

      if (!response.ok) {
        throw new Error("Failed to load history")
      }

      const data = await response.json()

      if (data.history.length === 0) {
        historyContent.innerHTML = `
          <div style="text-align: center; padding: 30px;">
            <div class="robot-container" style="margin-bottom: 20px;">
              <div class="robot-head">
                <div class="robot-antenna"></div>
                <div class="robot-eye left"></div>
                <div class="robot-eye right"></div>
                <div class="robot-mouth"></div>
              </div>
              <div class="robot-body"></div>
              <div class="robot-arm left"></div>
              <div class="robot-arm right"></div>
            </div>
            <div class="placeholder-text">No history available. Generate some images first!</div>
          </div>
        `

        // Reset robot animation
        if (robotMouth) {
          robotMouth.classList.remove("fast-talk", "error")
          robotMouth.classList.add("normal-talk")
        }
        return
      }

      let historyHtml = ""

      data.history.forEach((item, index) => {
        historyHtml += `
          <div class="history-item" style="opacity: 0; transform: translateY(20px);">
            <div class="history-item-header">
              <span class="history-item-number">#${index + 1}</span>
              <span class="history-item-timestamp">${item.timestamp}</span>
            </div>
            <div class="history-item-content">
              <div class="history-item-text">
                <div>
                  <div class="history-item-label">Description:</div>
                  <div class="history-item-value">${item.transcription}</div>
                </div>
                <div>
                  <div class="history-item-label">DALL-E Prompt:</div>
                  <div class="history-item-value">${item.dalle_prompt}</div>
                </div>
              </div>
              <div class="history-item-image">
                <img src="${item.local_image_path}" alt="Generated image" onerror="this.onerror=null; this.src='/static/placeholder.svg'; this.alt='Image failed to load'">
              </div>
            </div>
          </div>
        `
      })

      historyContent.innerHTML = historyHtml

      // Animate history items appearing one by one
      const historyItems = document.querySelectorAll(".history-item")
      historyItems.forEach((item, index) => {
        setTimeout(() => {
          item.style.transition = "opacity 0.5s ease, transform 0.5s ease"
          item.style.opacity = "1"
          item.style.transform = "translateY(0)"
        }, index * 100)
      })

      // Reset robot animation
      if (robotMouth) {
        robotMouth.classList.remove("fast-talk", "error")
        robotMouth.classList.add("normal-talk")
      }
    } catch (error) {
      console.error("Error:", error)

      historyContent.innerHTML = `
        <div style="text-align: center; padding: 30px;">
          <div class="robot-error">
            <div class="robot-error-circle"></div>
            <div class="robot-error-x">✕</div>
          </div>
          <div class="placeholder-text">Error loading history: ${error.message}</div>
        </div>
      `

      // Animate robot to show error
      const robotMouth = document.querySelector(".robot-mouth")
      if (robotMouth) {
        robotMouth.classList.remove("fast-talk", "normal-talk", "error")
        robotMouth.style.animation = "none"
        robotMouth.style.height = "2px"
        robotMouth.style.width = "15px"
        robotMouth.style.transform = "rotate(180deg)"
        setTimeout(() => {
          robotMouth.classList.add("normal-talk")
          robotMouth.style.animation = ""
          robotMouth.style.height = ""
          robotMouth.style.width = ""
          robotMouth.style.transform = ""
        }, 1000)
      }
    }
  }

  // Add shake animation for error feedback
  const style = document.createElement("style")
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
  `
  document.head.appendChild(style)

  // Initialize robot typing animations as hidden
  document.querySelectorAll(".robot-typing").forEach((element) => {
    element.style.display = "none"
  })

  // Make robot eyes blink occasionally
  setInterval(() => {
    const robotEyes = document.querySelectorAll(".robot-eye")
    robotEyes.forEach((eye) => {
      eye.classList.add("blink")
      setTimeout(() => {
        eye.classList.remove("blink")
      }, 300)
    })
  }, 5000)
})