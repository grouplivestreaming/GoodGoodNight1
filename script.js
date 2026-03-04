<script>
const config = {
    audioSrc: '1许狗与白宝子.mp3', // 音频文件URL（可以是相对路径或绝对URL）
    title: '许狗和白宝子',
    artist: '一个讲故事的小狗'
};

    // 初始化
    const audio = document.getElementById('audioPlayer');
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const loopBtn = document.getElementById('loopBtn');
    const timerBtn = document.getElementById('timerBtn');
    const timerText = document.getElementById('timerText');
    const countdownDisplay = document.getElementById('countdownDisplay');
    const heartIcon = document.getElementById('heartIcon');
    const progressBar = document.getElementById('progressBar');

    let isPlaying = false;
    let isLooping = false;
    let timerInterval = null;
    let countdownInterval = null;
    let timerEndTime = null;
    let isDragging = false; // 新增：是否正在拖动

    // 设置音频源
    audio.src = config.audioSrc;
    document.getElementById('songTitle').textContent = config.title;
    document.getElementById('artistName').textContent = config.artist;

    // iOS 音频初始化修复
    function initAudio() {
        audio.load();
        // 解锁 iOS 音频
        if (audio.paused) {
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
            }).catch(e => console.log('预加载失败:', e));
        }
    }
    
    // 首次触摸时初始化（iOS 要求）
    document.body.addEventListener('touchstart', initAudio, { once: true });

    // 播放/暂停切换
    function togglePlay() {
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
        } else {
            // iOS 需要用户交互后才能播放
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    isPlaying = true;
                    playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
                }).catch(error => {
                    console.log('播放失败:', error);
                    alert('无法播放音频，请检查文件路径是否正确');
                });
            }
        }
    }

    // 更新进度
    audio.addEventListener('timeupdate', () => {
        if (audio.duration && !isDragging) { // 拖动时不自动更新
            const progress = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = progress + '%';
            progressText.textContent = Math.round(progress) + '%';
            currentTimeEl.textContent = formatTime(audio.currentTime);
            durationEl.textContent = formatTime(audio.duration);
        }
    });

    // 音频加载完成后更新时间
    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
    });

    // 音频加载错误处理
    audio.addEventListener('error', (e) => {
        console.log('音频加载错误:', e);
        alert('音频文件加载失败，请检查：\n1. 文件名是否正确\n2. 文件是否已上传到仓库\n3. 文件路径是否正确');
    });

    // 音频结束
    audio.addEventListener('ended', () => {
        if (!isLooping) {
            isPlaying = false;
            playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
        }
    });

    // 格式化时间
    function formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }

    // 计算点击/触摸位置对应的进度百分比
    function calculateProgress(clientX) {
        const rect = progressBar.getBoundingClientRect();
        const clickX = clientX - rect.left;
        const width = rect.width;
        let percentage = clickX / width;
        // 限制在 0-1 之间
        percentage = Math.max(0, Math.min(1, percentage));
        return percentage;
    }

    // 更新进度条显示（用于拖动时）
    function updateProgressDisplay(percentage) {
        progressFill.style.width = (percentage * 100) + '%';
        progressText.textContent = Math.round(percentage * 100) + '%';
        if (audio.duration) {
            const current = percentage * audio.duration;
            currentTimeEl.textContent = formatTime(current);
        }
    }

    // 设置音频进度
    function setAudioProgress(percentage) {
        if (audio.duration) {
            audio.currentTime = percentage * audio.duration;
        }
    }

    // 点击进度条跳转（鼠标）
    progressBar.addEventListener('click', (e) => {
        if (!isDragging) {
            const percentage = calculateProgress(e.clientX);
            setAudioProgress(percentage);
            updateProgressDisplay(percentage);
        }
    });

    // 鼠标拖动功能
    progressBar.addEventListener('mousedown', (e) => {
        isDragging = true;
        const percentage = calculateProgress(e.clientX);
        updateProgressDisplay(percentage);
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        const percentage = calculateProgress(e.clientX);
        updateProgressDisplay(percentage);
    }

    function onMouseUp(e) {
        if (!isDragging) return;
        isDragging = false;
        const percentage = calculateProgress(e.clientX);
        setAudioProgress(percentage);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    // 触摸拖动功能（iPhone 关键）
    progressBar.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        const percentage = calculateProgress(touch.clientX);
        updateProgressDisplay(percentage);
    }, { passive: false });

    progressBar.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault(); // 防止页面滚动
        const touch = e.touches[0];
        const percentage = calculateProgress(touch.clientX);
        updateProgressDisplay(percentage);
    }, { passive: false });

    progressBar.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const touch = e.changedTouches[0];
        const percentage = calculateProgress(touch.clientX);
        setAudioProgress(percentage);
    });

    // 快进/快退
    function skipForward() {
        if (audio.duration) {
            audio.currentTime = Math.min(audio.currentTime + 10, audio.duration);
        }
    }

    function skipBackward() {
        audio.currentTime = Math.max(audio.currentTime - 10, 0);
    }

    // 循环切换
    function toggleLoop() {
        isLooping = !isLooping;
        audio.loop = isLooping;
        loopBtn.classList.toggle('active', isLooping);
    }

    // 喜欢切换
    function toggleLike() {
        const isLiked = heartIcon.getAttribute('fill') === 'currentColor';
        if (isLiked) {
            heartIcon.setAttribute('fill', 'none');
        } else {
            heartIcon.setAttribute('fill', 'currentColor');
        }
    }

    // 显示定时弹窗
    function showTimerModal() {
        document.getElementById('timerModal').classList.add('show');
    }

    // 关闭定时弹窗
    function closeTimerModal(event) {
        if (!event || event.target.id === 'timerModal') {
            document.getElementById('timerModal').classList.remove('show');
        }
    }

    // 设置定时器
    function setTimer(minutes) {
        clearTimer();
        
        const milliseconds = minutes * 60 * 1000;
        timerEndTime = Date.now() + milliseconds;
        
        timerText.textContent = minutes + '分';
        timerBtn.classList.add('active');
        countdownDisplay.classList.add('show');
        
        closeTimerModal();
        
        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
        
        timerInterval = setTimeout(() => {
            audio.pause();
            isPlaying = false;
            playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
            clearTimer();
        }, milliseconds);
    }

    // 更新倒计时显示
    function updateCountdown() {
        if (!timerEndTime) return;
        
        const remaining = Math.max(0, timerEndTime - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        countdownDisplay.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
        
        if (remaining <= 0) {
            countdownDisplay.classList.remove('show');
        }
    }

    // 清除定时器
    function clearTimer() {
        if (timerInterval) {
            clearTimeout(timerInterval);
            timerInterval = null;
        }
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        timerEndTime = null;
        
        timerText.textContent = '定时';
        timerBtn.classList.remove('active');
        countdownDisplay.classList.remove('show');
        closeTimerModal();
    }

    // 防止 iPhone 双击缩放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
</script>
