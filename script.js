import { musicDatabase, categories, coverImages } from './data.js';

document.addEventListener("DOMContentLoaded", () => {
    let currentArtistData = null;
    let currentAlbumIndex = 0;
    let thumbsArray = [];

    window.artistHistory = [];
    window.isGlobalPlaying = false;
    window.hasTrackSelection = false;
    window.globalCurrentTrackIndex = 0;
    window.currentProgress = 0;
    window.globalVolume = 1;
    window.isMuted = false;

    // =========================================================================
    // 1. BƠM MV LÊN LÀM MAIN PLAYER (HÌNH + TIẾNG)
    // =========================================================================
    const productBgContainer = document.querySelector("#view-product .bg-black");
    let bgVideo1, bgVideo2;
    if (productBgContainer && !document.getElementById("bg-video-1")) {
        // Bỏ 'muted', bỏ 'loop', bỏ CSS transition để GSAP thao túng 100% âm thanh và hình ảnh
        productBgContainer.innerHTML = `
            <img id="bg-image" src="" class="absolute inset-0 w-full h-full object-cover object-center scale-110 filter blur-[30px] opacity-20 transition-opacity duration-1000 z-0">
            <video id="bg-video-1" class="absolute inset-0 w-full h-full object-cover object-center scale-110 opacity-0 z-10" playsinline></video>
            <video id="bg-video-2" class="absolute inset-0 w-full h-full object-cover object-center scale-110 opacity-0 z-10" playsinline></video>
            <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-[#050505]/40 z-20"></div>
        `;
    }
    bgVideo1 = document.getElementById("bg-video-1");
    bgVideo2 = document.getElementById("bg-video-2");
    let activeVideoLayer = 1;
    let animationFrameId = null;
    window.isTransitioning = false;
    window.isMiniPlayerClosed = false;

    const viewHome = document.getElementById("view-home");
    const viewCatalog = document.getElementById("view-catalog");
    const viewArtist = document.getElementById("view-artist");
    const viewProduct = document.getElementById("view-product");
    const catalogContainer = document.getElementById("catalog-container");
    const productScroll = document.getElementById("product-scroll-container");
    const artistBannerImg = document.getElementById("artist-banner-img");
    const artistAboutImg = document.getElementById("artist-about-img");
    const artistPickImg = document.getElementById("artist-pick-img");
    const artistNameTitle = document.getElementById("artist-name-title");
    const artistBioName = document.getElementById("artist-bio-name");
    const artistTopTracks = document.getElementById("artist-top-tracks");
    const artistDiscography = document.getElementById("artist-discography");
    const artistFansLike = document.getElementById("artist-fans-like");
    const artistAppearsOn = document.getElementById("artist-appears-on");
    const detailVinyl = document.getElementById("detail-vinyl");
    const vinylBg = document.getElementById("detail-vinyl-bg");
    const vinylCenter = document.getElementById("detail-vinyl-center");
    const bgImage = document.getElementById("bg-image");
    const albumArt = document.getElementById("album-art");
    const detailAlbumTitle = document.getElementById("detail-album-title");
    const detailAlbumArtist = document.getElementById("detail-album-artist");
    const currentTimeEl = document.getElementById("current-time");
    const totalTimeEl = document.getElementById("total-time");
    const progressBar = document.getElementById("progress-bar");
    const tracklistContainer = document.getElementById("tracklist-container");
    const lyricsContainer = document.getElementById("lyrics-container");
    const carouselContainer = document.getElementById("carousel-container");
    const carouselTitle = document.getElementById("carousel-title");
    const mainPlayIcon = document.getElementById("main-play-icon");
    const btnExplore = document.getElementById("btn-explore");
    const btnMenu = document.getElementById("btn-menu");
    const btnThumbPrev = document.getElementById("thumb-prev");
    const btnThumbNext = document.getElementById("thumb-next");
    const menuBackdrop = document.getElementById("menu-backdrop");
    const overlayMenu = document.getElementById("overlay-menu");
    const customCursor = document.getElementById("custom-cursor");
    const globalReturnBtn = document.getElementById("global-return-btn");
    const globalMiniPlayer = document.getElementById("global-mini-player");
    const miniPlayerImg = document.getElementById("mini-player-img");
    const miniPlayerTitle = document.getElementById("mini-player-title");
    const miniPlayerArtist = document.getElementById("mini-player-artist");
    const miniPlayIcon = document.getElementById("mini-play-icon");

    const views = { home: viewHome, catalog: viewCatalog, artist: viewArtist, product: viewProduct };

    // =========================================================================
    // HÀM XỬ LÝ KÉO TRƯỢT (SCRUBBING) CHO TIME VÀ VOLUME
    // =========================================================================
    function initScrubbing(containerId, onUpdate) {
        const container = document.getElementById(containerId);
        if (!container) return;
        let isDragging = false;

        const handleMove = (e) => {
            const rect = container.getBoundingClientRect();
            const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
            const percent = Math.max(0, Math.min(x / rect.width, 1));
            onUpdate(percent);
        };

        container.addEventListener('mousedown', (e) => { isDragging = true; handleMove(e); });
        window.addEventListener('mousemove', (e) => { if (isDragging) handleMove(e); });
        window.addEventListener('mouseup', () => { isDragging = false; });
        // Hỗ trợ cảm ứng (Mobile)
        container.addEventListener('touchstart', (e) => { isDragging = true; handleMove(e); }, {passive: true});
        window.addEventListener('touchmove', (e) => { if (isDragging) handleMove(e); }, {passive: true});
        window.addEventListener('touchend', () => { isDragging = false; });
    }

    // Kích hoạt kéo cho Thanh nhạc và Âm lượng
    initScrubbing("progress-container", (percent) => {
        const player = getMainPlayer();
        if (player && player.duration) {
            player.currentTime = percent * player.duration;
            if (progressBar) progressBar.style.width = `${percent * 100}%`;
            if (currentTimeEl) currentTimeEl.innerText = formatRealTime(player.currentTime);
        }
    });

    initScrubbing("volume-container", (percent) => {
        window.globalVolume = percent; window.isMuted = percent === 0;
        const player = getMainPlayer(); if (player) player.volume = percent;
        
        if (document.getElementById("volume-bar")) document.getElementById("volume-bar").style.width = `${percent * 100}%`;
        if (document.getElementById("mini-volume-bar")) document.getElementById("mini-volume-bar").style.width = `${percent * 100}%`;
        const volPercentText = document.getElementById("volume-percent");
        if (volPercentText) volPercentText.innerText = `${Math.round(percent * 100)}%`;

        const iconClass = percent === 0 ? "ph-fill ph-speaker-slash text-lg" : "ph-fill ph-speaker-high text-lg";
        const miniIconClass = percent === 0 ? "ph-fill ph-speaker-slash text-white/40 hover:text-white transition-colors text-sm" : "ph-fill ph-speaker-high text-white/40 hover:text-white transition-colors text-sm";
        if (document.getElementById("volume-icon")) document.getElementById("volume-icon").className = iconClass;
        if (document.getElementById("mini-volume-icon")) document.getElementById("mini-volume-icon").className = miniIconClass;
    });

    initScrubbing("mini-volume-container", (percent) => {
        window.globalVolume = percent; window.isMuted = percent === 0;
        const player = getMainPlayer(); if (player) player.volume = percent;
        
        if (document.getElementById("volume-bar")) document.getElementById("volume-bar").style.width = `${percent * 100}%`;
        if (document.getElementById("mini-volume-bar")) document.getElementById("mini-volume-bar").style.width = `${percent * 100}%`;
        const volPercentText = document.getElementById("volume-percent");
        if (volPercentText) volPercentText.innerText = `${Math.round(percent * 100)}%`;

        const iconClass = percent === 0 ? "ph-fill ph-speaker-slash text-lg" : "ph-fill ph-speaker-high text-lg";
        const miniIconClass = percent === 0 ? "ph-fill ph-speaker-slash text-white/40 hover:text-white transition-colors text-sm" : "ph-fill ph-speaker-high text-white/40 hover:text-white transition-colors text-sm";
        if (document.getElementById("volume-icon")) document.getElementById("volume-icon").className = iconClass;
        if (document.getElementById("mini-volume-icon")) document.getElementById("mini-volume-icon").className = miniIconClass;
    });

    // Bắt sự kiện Click vào thân MiniPlayer để mở đĩa than
    document.getElementById("mini-player-body")?.addEventListener("click", () => {
        window.switchView(getCurrentViewKey(), "product", animateProductIntro);
    });

    let isMenuOpen = false;

    const playerLyrics = [
        "Màn đêm buông xuống, ánh đèn hiu hắt...",
        "Lạc trong câu hát, tìm lại phút giây...",
        "Symphony vang lên, đánh thức trái tim ngủ quên.",
        "Mọi âu lo như tan biến vào hư không...",
        "Chỉ còn ta với âm nhạc thăng hoa."
    ];

    function generateVinylImage() {
        const canvas = document.createElement("canvas");
        canvas.width = 1024; canvas.height = 1024;
        const ctx = canvas.getContext("2d");
        const cx = 512; const cy = 512;

        ctx.fillStyle = "#080808"; ctx.beginPath(); ctx.arc(cx, cy, 500, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 1;
        for (let radius = 170; radius < 490; radius += 2.5) {
            ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.05})`; ctx.stroke();
        }

        if (ctx.createConicGradient) {
            const gradient = ctx.createConicGradient(Math.PI / 4, cx, cy);
            gradient.addColorStop(0, "rgba(255,255,255,0)"); gradient.addColorStop(0.1, "rgba(255,255,255,0.1)");
            gradient.addColorStop(0.2, "rgba(255,255,255,0)"); gradient.addColorStop(0.5, "rgba(255,255,255,0)");
            gradient.addColorStop(0.6, "rgba(255,255,255,0.1)"); gradient.addColorStop(0.7, "rgba(255,255,255,0)");
            gradient.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(cx, cy, 500, 0, Math.PI * 2); ctx.fill();
        }

        ctx.fillStyle = "#c4281c"; ctx.beginPath(); ctx.arc(cx, cy, 160, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#e8b923"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 150, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#e8b923"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = 'bold 36px "Playfair Display", serif';
        ctx.fillText("SYMPHONY", cx, cy - 40);
        ctx.fillStyle = "#ffffff"; ctx.font = 'bold 16px "Inter", sans-serif'; ctx.fillText("STEREO", cx, cy + 40);
        ctx.fillStyle = "#050505"; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();

        return canvas.toDataURL("image/png");
    }

    if (vinylBg) vinylBg.src = generateVinylImage();

    // Định dạng thời gian thực tế từ Audio
    function formatRealTime(timeInSeconds) {
        if (isNaN(timeInSeconds)) return "0:00";
        const mins = Math.floor(timeInSeconds / 60);
        const secs = Math.floor(timeInSeconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    function getActiveTrack() {
        if (!currentArtistData || !currentArtistData.albums?.length) return null;
        return currentArtistData.albums[currentAlbumIndex]?.tracks?.[window.globalCurrentTrackIndex] || null;
    }

    // Hàm gọi MV đang chạy hiện tại
    function getMainPlayer() { return activeVideoLayer === 1 ? bgVideo1 : bgVideo2; }

    function resetPlaybackState() {
        if(bgVideo1) { bgVideo1.pause(); bgVideo1.currentTime = 0; }
        if(bgVideo2) { bgVideo2.pause(); bgVideo2.currentTime = 0; }
        cancelAnimationFrame(animationFrameId);
        window.isGlobalPlaying = false; 
        window.hasTrackSelection = false;
        window.globalCurrentTrackIndex = 0; 
        window.currentProgress = 0;
        if (progressBar) progressBar.style.width = "0%";
        if (currentTimeEl) currentTimeEl.innerText = "0:00";
        detailVinyl?.classList.remove("is-playing");
    }

    function getScrollStep(container) {
        const firstItem = container.querySelector(".product-card, .snap-start");
        if (!firstItem) return container.clientWidth * 0.9;
        return firstItem.getBoundingClientRect().width + 32;
    }

    window.scrollRow = (btn, direction) => {
        const container = btn?.parentElement?.querySelector(".scroll-row");
        if (!container) return;
        const scrollAmount = getScrollStep(container) * 2.5;
        container.scrollBy({ left: scrollAmount * direction, behavior: "smooth" });
    };

    window.updateScrollArrows = (container) => {
        if (!container) return;
        const parent = container.parentElement;
        if (!parent) return;

        const btnLeft = parent.querySelector(".btn-scroll-left");
        const btnRight = parent.querySelector(".btn-scroll-right");
        if (!btnLeft || !btnRight) return;

        const canScroll = Math.ceil(container.scrollWidth) > Math.ceil(container.clientWidth) + 10;
        if (!canScroll) {
            btnLeft.classList.add("hidden"); btnLeft.classList.remove("sm:flex");
            btnRight.classList.add("hidden"); btnRight.classList.remove("sm:flex");
            return;
        }

        btnLeft.classList.remove("hidden"); btnLeft.classList.add("sm:flex");
        btnRight.classList.remove("hidden"); btnRight.classList.add("sm:flex");

        if (container.scrollLeft > 10) {
            btnLeft.classList.remove("opacity-0", "pointer-events-none");
            btnLeft.classList.add("group-hover/scroll:opacity-100", "pointer-events-auto");
        } else {
            btnLeft.classList.add("opacity-0", "pointer-events-none");
            btnLeft.classList.remove("group-hover/scroll:opacity-100", "pointer-events-auto");
        }

        if (Math.ceil(container.scrollLeft + container.clientWidth) >= container.scrollWidth - 10) {
            btnRight.classList.add("opacity-0", "pointer-events-none");
            btnRight.classList.remove("group-hover/scroll:opacity-100", "pointer-events-auto");
        } else {
            btnRight.classList.remove("opacity-0", "pointer-events-none");
            btnRight.classList.add("group-hover/scroll:opacity-100", "pointer-events-auto");
        }
    };

    window.refreshScrollRows = () => {
        document.querySelectorAll(".scroll-row").forEach((row) => window.updateScrollArrows(row));
    };

    // =========================================================================
    // THE CINEMATIC ACCORDION CATALOG
    // =========================================================================
    function renderCatalog() {
        const accordion = document.getElementById("catalog-accordion");
        if (!accordion) return;

        let html = "";
        let globalIndexOffset = 0;

        categories.forEach((cat, idx) => {
            let bgImg = coverImages[idx % coverImages.length];
            if (cat.items.length > 0 && musicDatabase[cat.items[0]]) {
                const first = musicDatabase[cat.items[0]];
                bgImg = first.bannerImg || first.avatarImg || (first.albums && first.albums[0].img) || bgImg;
            }

            html += `
                <div class="accordion-panel relative h-full flex-[1] border-r border-white/5 cursor-pointer group/panel overflow-hidden bg-black" data-index="${idx}">
                    
                    <div class="absolute inset-0 w-[100vw] h-full pointer-events-none origin-left z-0">
                        <img src="${bgImg}" class="bg-img absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out opacity-30 grayscale-[80%] scale-100 group-hover/panel:opacity-70 group-hover/panel:grayscale-[20%] group-hover/panel:scale-[1.02]">
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-[#050505]/60 pointer-events-none z-10"></div>

                    <div class="title-collapsed absolute inset-0 flex flex-col items-center justify-end pb-16 pointer-events-none transition-opacity duration-500 z-20">
                        <span class="text-white/20 font-sans text-[0.65rem] tracking-[0.4em] mb-12 group-hover/panel:text-white/60 transition-colors">0${idx + 1}</span>
                        <h2 class="text-white/30 font-serif text-2xl tracking-[0.2em] uppercase whitespace-nowrap transform -rotate-180 transition-colors group-hover/panel:text-white" style="writing-mode: vertical-rl;">
                            ${cat.title}
                        </h2>
                    </div>

                    <div class="content-expanded absolute inset-0 flex flex-col pt-[220px] lg:pt-[240px] px-8 md:px-12 lg:px-20 pb-12 opacity-0 pointer-events-none z-30 overflow-y-auto hide-scrollbar custom-scrollbar">
                        <div class="cat-info-block w-max shrink-0 mb-8 lg:mb-12 pointer-events-none opacity-0">
                            <span class="text-white/30 font-sans text-[0.55rem] tracking-[0.5em] uppercase mb-4 block whitespace-nowrap">Collection 0${idx + 1}</span>
                            <h1 class="text-4xl md:text-5xl lg:text-[4.5rem] font-serif text-white tracking-widest drop-shadow-2xl mb-4 uppercase font-light leading-tight whitespace-nowrap">${cat.title}</h1>
                            <p class="text-white/40 font-sans text-[0.65rem] tracking-[0.3em] uppercase ml-1 whitespace-nowrap">${cat.desc}</p>
                        </div>

                        <div class="relative w-full flex-1 flex items-center min-h-[350px] group/scroll">
                            <button class="btn-scroll-left absolute left-0 md:-left-2 z-[70] w-12 h-12 bg-[#050505]/90 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all duration-300 opacity-0 pointer-events-none hidden sm:flex" onclick="scrollRow(this, -1)">
                                <i class="ph-light ph-caret-left text-2xl -ml-1"></i>
                            </button>

                            <div class="scroll-row flex gap-6 md:gap-10 overflow-x-auto hide-scrollbar snap-x snap-mandatory w-full items-center py-4 px-2" onscroll="updateScrollArrows(this)">
                                ${generateCardsHTML(cat, idx, globalIndexOffset)}
                            </div>

                            <button class="btn-scroll-right absolute right-0 md:-right-2 z-[70] w-12 h-12 bg-[#050505]/90 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all duration-300 opacity-0 pointer-events-none hidden sm:flex" onclick="scrollRow(this, 1)">
                                <i class="ph-light ph-caret-right text-2xl ml-1"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            globalIndexOffset += cat.items.length;
        });

        accordion.innerHTML = html;

        const panels = document.querySelectorAll('.accordion-panel');
        let activeIdx = -1;

        panels.forEach((panel, idx) => {
            panel.addEventListener('click', (e) => {
                if(e.target.closest('.product-card') || e.target.closest('button')) return; 
                if(activeIdx === idx) return; 
                activeIdx = idx;

                panels.forEach((p, i) => {
                    const isTarget = i === idx;
                    const bgImg = p.querySelector('.bg-img');
                    const titleCol = p.querySelector('.title-collapsed');
                    const contentExp = p.querySelector('.content-expanded');
                    const infoBlock = p.querySelector('.cat-info-block'); // Bắt khối chữ vừa tạo
                    const cards = p.querySelectorAll('.product-card');

                    if (isTarget) {
                        gsap.to(p, { flex: 12, duration: 0.8, ease: "power2.inOut", overwrite: "auto" });
                        bgImg.className = "bg-img absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-in-out opacity-20 grayscale-0 scale-[1.02]";
                        
                        gsap.to(titleCol, { opacity: 0, x: -20, duration: 0.3, overwrite: "auto" });
                        
                        contentExp.classList.remove("pointer-events-none");
                        contentExp.classList.add("pointer-events-auto");
                        gsap.to(contentExp, { opacity: 1, duration: 0.5, delay: 0.3, overwrite: "auto" });
                        
                        // ANIMATION CHỮ: Trượt mượt mà từ trái sang, nguyên khối
                        if(infoBlock) {
                            gsap.fromTo(infoBlock, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out", delay: 0.3, overwrite: "auto" });
                        }

                        gsap.fromTo(cards,
                            { opacity: 0, x: 20 },
                            { opacity: 1, x: 0, duration: 0.6, stagger: 0.04, ease: "power2.out", delay: 0.35, overwrite: "auto" }
                        );
                        setTimeout(() => { const r = p.querySelector('.scroll-row'); if(r) window.updateScrollArrows(r); }, 850);
                    } else {
                        gsap.to(p, { flex: 1, duration: 0.8, ease: "power2.inOut", overwrite: "auto" });
                        bgImg.className = "bg-img absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-in-out opacity-30 grayscale-[80%] scale-100 group-hover/panel:opacity-70 group-hover/panel:grayscale-[20%] group-hover/panel:scale-[1.02]";
                        
                        if(infoBlock) gsap.to(infoBlock, { opacity: 0, x: -20, duration: 0.2, overwrite: "auto" });
                        gsap.to(titleCol, { opacity: 1, x: 0, duration: 0.3, delay: 0.3, overwrite: "auto" });
                        
                        contentExp.classList.add("pointer-events-none");
                        contentExp.classList.remove("pointer-events-auto");
                        gsap.to(contentExp, { opacity: 0, duration: 0.2, overwrite: "auto" });
                    }
                });
            });
        });
        // BẮT SỰ KIỆN CLICK CARD (CỰC NHẠY, BẤM LÀ ĂN NGAY)
        accordion.addEventListener("click", (e) => {
            const card = e.target.closest(".product-card");
            if (card) {
                // ĐÃ XÓA dòng check activeIdx ở đây. Bất chấp UI đang chạy animation, bấm là load nhạc ngay!
                
                const itemId = card.getAttribute("data-item-id");
                currentArtistData = musicDatabase[itemId];
                if (!currentArtistData) return;

                if (currentArtistData.type === "artist") {
                    window.artistHistory = [currentArtistData.name];
                    window.renderArtistView(currentArtistData);
                    
                    // THÊM VÀO ĐÂY: Chỉ cuộn lên đầu trang khi mở một Ca sĩ MỚI từ Catalog
                    viewArtist.scrollTo(0, 0); 
                    
                    window.switchView("catalog", "artist", animateArtistIntro);
                    return;
                }
                renderAlbumCarousel();
                window.loadAlbumToPlayer(currentArtistData.initialIndex);
                window.switchView("catalog", "product", animateProductIntro);
            }
        });
    }

    function generateCardsHTML(category, catIdx, globalOffset) {
        let cardsHtml = "";
        
        category.items.forEach((itemName, itemIndex) => {
            const currentGlobalIndex = globalOffset + itemIndex;
            const itemId = `item_${currentGlobalIndex}`;
            let itemData = musicDatabase[itemName];

            // Nếu chưa khai báo ca sĩ/album trong Data, tự tạo một bộ khung trống tránh lỗi
            if (!itemData) {
                itemData = { 
                    name: itemName, 
                    type: category.itemType, 
                    albums: [{ title: "Chưa cập nhật", img: coverImages[currentGlobalIndex % coverImages.length], tracks: [] }] 
                };
            }
            musicDatabase[itemId] = itemData; 

            let displaySubtitle = itemData.type === "artist" ? "Artist" : "Album";
            let cardImageHTML = "";
            const itemImg = itemData.avatarImg || (itemData.albums && itemData.albums[0]?.img) || coverImages[0];

            if (itemData.type === "artist") {
                cardImageHTML = `
                    <div class="w-full aspect-[2/3] overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 bg-[#0a0a0a] z-10 group/card">
                        <img src="${itemImg}" loading="lazy" class="w-full h-full object-cover filter grayscale-[100%] brightness-[0.6] group-hover/card:grayscale-0 group-hover/card:brightness-100 group-hover/card:scale-[1.05] transition-all duration-[700ms] ease-out">
                        <div class="absolute inset-0 bg-black/20 group-hover/card:bg-transparent transition-colors duration-500 pointer-events-none"></div>
                    </div>`;
            } else {
                const albumImg = itemData.albums[0]?.img || coverImages[0];
                cardImageHTML = `
                    <div class="w-full aspect-square relative border border-white/10 bg-black shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10 mt-6 md:mt-10 group/card">
                        <div class="absolute inset-0 z-10 overflow-hidden bg-[#111]">
                            <img src="${albumImg}" class="w-full h-full object-cover filter grayscale-[100%] brightness-[0.6] group-hover/card:grayscale-0 group-hover/card:brightness-100 group-hover/card:scale-110 transition-all duration-[700ms] ease-out">
                        </div>
                    </div>`;
            }

            cardsHtml += `
        <div class="snap-start shrink-0 w-[150px] md:w-[180px] xl:w-[220px] cursor-pointer product-card flex flex-col gap-3 relative z-50" data-item-id="${itemId}">
                    <span class="absolute -top-7 left-2 font-serif text-white/10 text-4xl italic pointer-events-none z-0">0${itemIndex + 1}</span>
                    ${cardImageHTML}
                    <div class="px-1 z-10 flex flex-col gap-1 group/text w-full pointer-events-none">
                        <h3 class="font-serif text-lg md:text-xl text-white/50 group-hover/text:text-white transition-colors tracking-wide truncate w-full">${itemName}</h3>
                        <p class="font-sans text-[0.55rem] uppercase tracking-[0.3em] text-white/20 group-hover/text:text-white/50 transition-colors">${displaySubtitle}</p>
                    </div>
                </div>`;
        });
        return cardsHtml;
    }

    function animateCatalogIntro() {
        gsap.fromTo(".accordion-panel", { y: "100%" }, { y: "0%", duration: 1.2, stagger: 0.1, ease: "expo.out", overwrite: "auto" });
    }

    function animateArtistIntro() {
        // Đã xoá lệnh scrollTo(0,0) ở đây để không bị reset vị trí cuộn khi Return
        gsap.fromTo(".artist-anim", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power2.out" });
    }

    function animateProductIntro() {
        productScroll.scrollTo(0, 0);
        gsap.fromTo(".product-anim", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power2.out" });
    }

    function getCurrentViewKey() { return Object.keys(views).find((key) => !views[key].classList.contains("hidden-view")) || "home"; }

    function showView(key) {
        Object.entries(views).forEach(([viewKey, viewEl]) => {
            if (!viewEl) return;
            if (viewKey === key) { viewEl.classList.remove("hidden-view"); gsap.set(viewEl, { opacity: 1 }); } 
            else { viewEl.classList.add("hidden-view"); gsap.set(viewEl, { opacity: 0 }); }
        });
    }

    function closeMenuState() {
        if (!overlayMenu || !menuBackdrop) return;
        isMenuOpen = false; document.body.classList.remove("menu-open");
        menuBackdrop.classList.add("pointer-events-none");
        gsap.to(menuBackdrop, { opacity: 0, duration: 0.2, ease: "power2.out" });
        gsap.to(overlayMenu, { xPercent: -100, duration: 0.3, ease: "power3.inOut" });
    }

    function openMenuState() {
        if (!overlayMenu || !menuBackdrop) return;
        isMenuOpen = true; document.body.classList.add("menu-open");
        menuBackdrop.classList.remove("pointer-events-none");
        gsap.to(menuBackdrop, { opacity: 1, duration: 0.25, ease: "power2.out" });
        gsap.to(overlayMenu, { xPercent: 0, duration: 0.35, ease: "power3.out" });
    }

    window.openMenu = () => openMenuState(); window.closeMenu = () => closeMenuState();

    globalReturnBtn?.addEventListener("click", () => {
        const currentView = getCurrentViewKey();
        if (currentView === "catalog") window.goToHome();
        else if (currentView === "artist") window.goToCatalogFromArtist();
        else if (currentView === "product") window.returnFromProduct();
    });

    function updateGlobalReturnStyle() {
        if (!globalReturnBtn) return;
        const currentViewKey = getCurrentViewKey();
        let activeScroll = null;
        
        if (currentViewKey === "catalog") { activeScroll = document.querySelector('.content-expanded[style*="pointer-events: auto"]'); }
        else if (currentViewKey === "artist") activeScroll = viewArtist;
        else if (currentViewKey === "product") activeScroll = productScroll;

        if (activeScroll && activeScroll.scrollTop > 24) globalReturnBtn.classList.add("glass-pill");
        else globalReturnBtn.classList.remove("glass-pill");
    }

    [viewArtist, productScroll].forEach(el => { el?.addEventListener("scroll", updateGlobalReturnStyle); });

    window.switchView = (fromKey, toKey, callback = null, isReturning = false) => {
        // 1. ĐÃ XÓA HOÀN TOÀN KHOÁ isTransitioning! Bạn có thể spam click thoải mái.
        
        const fromView = views[fromKey]; const toView = views[toKey];
        if (!toView || fromKey === toKey) return;
        
        // 2. Dập tắt ngay các hiệu ứng chuyển cảnh cũ nếu người dùng click chuyển trang liên tục
        gsap.killTweensOf([fromView, toView]);
        
        closeMenuState();
        if (callback) callback(); 

        if (toKey === "home") {
            gsap.to(globalReturnBtn, { opacity: 0, x: -20, duration: 0.2, ease: "power2.inOut", onComplete: () => {
                globalReturnBtn.classList.add("pointer-events-none"); globalReturnBtn.classList.remove("glass-pill");
            }});
        } else {
            globalReturnBtn.classList.remove("pointer-events-none");
            gsap.to(globalReturnBtn, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out", delay: 0.1 });
            setTimeout(updateGlobalReturnStyle, 50); 
        }

        gsap.set(toView, { opacity: 0, x: isReturning ? -20 : 20 }); // Thu hẹp khoảng cách trượt
        toView.classList.remove("hidden-view");

        // 3. ÉP TỐC ĐỘ ANIMATION XUỐNG CÒN 0.25s VÀ 0.35s (Nhanh như điện)
        const tl = gsap.timeline({
            onComplete: () => {
                fromView.classList.add("hidden-view");
                gsap.set(fromView, { clearProps: "transform" }); gsap.set(toView, { clearProps: "transform" });
                requestAnimationFrame(() => window.refreshScrollRows());
                if (toKey === "catalog") {
                    document.querySelectorAll('.content-expanded').forEach(el => { el.addEventListener("scroll", updateGlobalReturnStyle); });
                }
                window.checkMiniPlayerVisibility(); 
            }
        });

        // Sử dụng overwrite: "auto" để GSAP xử lý mượt nếu người dùng spam
        tl.to(fromView, { opacity: 0, x: isReturning ? 30 : -30, duration: 0.25, ease: "power2.inOut", overwrite: "auto" })
          .to(toView, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out", overwrite: "auto" }, "-=0.15");
    };

    window.goToHome = () => {
        const currentView = getCurrentViewKey();
        if (currentView === "home") { closeMenuState(); return; }
        // Đã bỏ resetPlaybackState() ở đây để giữ nhạc chạy nền
        window.artistHistory = []; window.switchView(currentView, "home");
    };

    window.goToCatalog = () => {
        const currentView = getCurrentViewKey();
        if (currentView === "catalog") { closeMenuState(); return; }
        // Đã bỏ resetPlaybackState() ở đây để giữ nhạc chạy nền
        if (currentView === "artist") { window.artistHistory = []; }
        window.switchView(currentView, "catalog", animateCatalogIntro);
    };

    window.goToCatalogFromArtist = () => {
        if (window.artistHistory.length > 1) {
            window.artistHistory.pop();
            const previousArtist = window.artistHistory[window.artistHistory.length - 1];

            for (const key in musicDatabase) {
                if (musicDatabase[key].name === previousArtist) {
                    currentArtistData = musicDatabase[key];
                    gsap.to(viewArtist, {
                        opacity: 0, duration: 0.3, ease: "power2.inOut",
                        onComplete: () => {
                            window.renderArtistView(currentArtistData);
                            viewArtist.scrollTo(0, 0); 
                            gsap.set(viewArtist, { opacity: 1 });
                            gsap.fromTo(".artist-anim", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power2.out" });
                            gsap.fromTo("#artist-banner-img", { opacity: 0 }, { opacity: 0.8, duration: 0.6 });
                        }
                    });
                    return;
                }
            }
        }
        window.artistHistory = [];
        window.switchView("artist", "catalog", animateCatalogIntro, true);
    };

    window.returnFromProduct = () => {
        // Đã xoá lệnh resetPlaybackState() chết chóc ở đây! Nhạc sẽ tiếp tục phát.
        if (window.artistHistory[window.artistHistory.length - 1] === "album_view") window.artistHistory.pop();
        const targetView = window.artistHistory.length > 0 ? "artist" : "catalog";
        const targetAnim = targetView === "artist" ? animateArtistIntro : animateCatalogIntro;
        window.switchView("product", targetView, targetAnim, true);
    };

    window.openAlbumFromArtist = (albumIndex, trackIndex = null) => {
    window.artistHistory.push("album_view");
    currentArtistData.initialIndex = albumIndex;
    carouselTitle.innerText = "Albums & Singles";
    renderAlbumCarousel();
    window.loadAlbumToPlayer(albumIndex);
    window.switchView("artist", "product", animateProductIntro);

    // Nếu có truyền trackIndex vào (từ mục Phổ biến), đợi UI chuyển cảnh xíu rồi Play luôn
    if (trackIndex !== null) {
        setTimeout(() => {
            window.playTrack(trackIndex);
        }, 500); // Có thể chỉnh số này (500ms) tuỳ độ dài animation switchView
    }
};

    window.openArtistFromFan = (fanName) => {
        // 1. Quét toàn bộ Data để tìm chính xác tên Ca sĩ
        let data = null;
        for (const key in musicDatabase) {
            if (musicDatabase[key].name === fanName) {
                data = musicDatabase[key];
                break;
            }
        }
        
        // 2. Nếu Ca sĩ chưa có trong file data.js, TỰ ĐỘNG TẠO TRANG ẢO để giữ mượt UX
        if (!data) {
            data = {
                name: fanName,
                type: "artist",
                bio: `Thông tin của nghệ sĩ ${fanName} đang được cập nhật trên hệ thống Symphony...`,
                albums: [
                    { title: "Top Hit Singles", img: coverImages[Math.floor(Math.random() * coverImages.length)], tracks: [] }
                ]
            };
        }

        window.artistHistory.push(data.name); 
        currentArtistData = data;
        
        // 3. Chuyển cảnh mượt mà và ÉP CUỘN LÊN ĐẦU TRANG
        gsap.to(viewArtist, {
            opacity: 0, duration: 0.3, ease: "power2.inOut",
            onComplete: () => {
                window.renderArtistView(data);
                
                // ĐƯA LÊN ĐẦU TRANG KHI QUA CA SĨ MỚI
                viewArtist.scrollTo(0, 0); 
                
                gsap.set(viewArtist, { opacity: 1 });
                gsap.fromTo(".artist-anim", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power2.out" });
                gsap.fromTo("#artist-banner-img", { opacity: 0 }, { opacity: 0.8, duration: 0.6 });
            }
        });
    };

    window.renderArtistView = (data) => {
        if (!data) return;
        artistNameTitle.innerText = data.name; artistBioName.innerText = data.name;
        const defaultImg = data.albums?.[0]?.img || coverImages[0];
        artistBannerImg.src = data.bannerImg || defaultImg;
        artistAboutImg.src = data.aboutImg || defaultImg;
        artistPickImg.src = data.albums?.[0]?.img || defaultImg;
        
        const bioText = viewArtist.querySelector(".artist-anim p.line-clamp-4");
        if (bioText) bioText.innerText = data.bio || "Nghệ sĩ chưa có phần giới thiệu.";

        artistTopTracks.innerHTML = ""; let count = 1;
        if (data.albums) {
            data.albums.forEach((album, albumIdx) => { // <-- Thêm albumIdx
                album.tracks.forEach((track, trackIdx) => { // <-- Thêm trackIdx
                    if (count > 5) return;
                    // Thêm onclick="openAlbumFromArtist(${albumIdx}, ${trackIdx})" vào div cha
                    artistTopTracks.innerHTML += `<div class="flex items-center justify-between p-3 md:p-4 rounded-xl hover:bg-white/5 transition-all duration-300 group pointer-events-auto cursor-pointer border border-transparent hover:border-white/10">
        <div class="flex items-center gap-4 md:gap-6 flex-1" onclick="openAlbumFromArtist(${albumIdx}, ${trackIdx})">
            <div class="w-8 h-8 rounded-full border border-transparent group-hover:border-white/30 group-hover:bg-white/10 flex justify-center items-center relative transition-all duration-500" onclick="event.stopPropagation(); toggleTrackFromArtist(${albumIdx}, ${trackIdx})">
                <span id="popular-num-${albumIdx}-${trackIdx}" class="text-white/40 group-hover:opacity-0 transition-opacity duration-300 absolute font-serif italic text-sm">${count++}</span>
                <i id="popular-play-${albumIdx}-${trackIdx}" class="ph-fill ph-play text-white opacity-0 group-hover:opacity-100 transition-all duration-300 absolute hover:scale-110 text-sm ml-0.5"></i>
            </div>
            <img src="${album.img}" class="w-10 h-10 md:w-12 md:h-12 rounded-md object-cover shadow-md">
            <span class="font-medium text-white/70 group-hover:text-white transition-colors tracking-wide">${track.title}</span>
        </div>
        <span class="text-white/30 group-hover:text-white/60 text-xs md:text-sm pointer-events-none transition-colors">${track.time}</span>
    </div>`;
                });
            });
        }

        artistDiscography.innerHTML = "";
        if (data.albums) {
            data.albums.forEach((album, idx) => {
                artistDiscography.innerHTML += `
                    <div class="snap-start shrink-0 w-[160px] md:w-[200px] group cursor-pointer pointer-events-auto product-card" onclick="openAlbumFromArtist(${idx})">
                        <div class="relative w-full aspect-square mb-4">
                            <div class="vinyl-record"><img src="${vinylBg?.src}" class="absolute inset-0 w-full h-full rounded-full shadow-lg"><img src="${album.img}" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[33%] h-[33%] rounded-full object-cover border-[2px] border-[#e8b923]/60 shadow-inner"><div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#050505] rounded-full border border-white/20 z-10"></div></div>
                            <div class="album-cover absolute inset-0 w-full h-full bg-[#222] rounded-md overflow-hidden shadow-lg z-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.6)]">
                                <img src="${album.img}" class="w-full h-full object-cover">
                                <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                <button onclick="event.stopPropagation(); toggleAlbumFromArtist(${idx})" class="absolute bottom-4 right-4 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-white hover:text-black hover:scale-110 shadow-[0_8px_20px_rgba(0,0,0,0.5)] translate-y-4 group-hover:translate-y-0 z-20"><i id="album-play-${idx}" class="ph-fill ph-play text-xl ml-1 transition-transform duration-300"></i></button>
                            </div>
                        </div>
                        <h3 class="font-sans font-semibold text-sm md:text-base text-white/90 group-hover:text-white truncate">${album.title}</h3>
                        <p class="font-sans text-white/40 text-[0.65rem] uppercase tracking-[0.1em] mt-1">2026 • Album</p>
                    </div>`;
            });
        }

        // Đổ dữ liệu Fan cũng thích
        artistFansLike.innerHTML = "";
        const fansList = data.fansLike || ["Anh Tú", "Isaac", "Lâm Bảo Ngọc", "Jun Phạm"];
        fansList.forEach(name => {
            const fanData = musicDatabase[name] || { albums: [{img: coverImages[Math.floor(Math.random()*coverImages.length)]}] };
            const img = fanData.avatarImg || fanData.albums[0].img;
            artistFansLike.innerHTML += `
                <div class="snap-start shrink-0 w-[140px] md:w-[180px] group cursor-pointer pointer-events-auto" onclick="openArtistFromFan('${name}')">
                    <div class="relative aspect-square mb-3 overflow-hidden rounded-full shadow-lg border border-white/5">
                        <img src="${img}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                        <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                    </div>
                    <h3 class="font-sans font-semibold text-sm text-center text-white/90 group-hover:text-white truncate">${name}</h3>
                </div>`;
        });

        // Đổ dữ liệu Có sự xuất hiện của
        artistAppearsOn.innerHTML = "";
        const appearsList = data.appearsOn || [{ title: "V-Pop Rising", img: coverImages[1], type: "Playlist" }];
        appearsList.forEach(item => {
            artistAppearsOn.innerHTML += `
                <div class="snap-start shrink-0 w-[160px] md:w-[200px] group cursor-pointer pointer-events-auto">
                    <div class="relative aspect-square mb-4 overflow-hidden rounded-md shadow-lg border border-white/5 bg-[#222]">
                        <img src="${item.img}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                    </div>
                    <h3 class="font-sans font-semibold text-sm text-white/90 group-hover:text-white truncate">${item.title}</h3>
                </div>`;
        });

        requestAnimationFrame(() => window.refreshScrollRows());
    };

    function renderAlbumCarousel() {
        carouselContainer.innerHTML = "";
        currentArtistData.albums.forEach((album, idx) => {
            // Dự phòng nếu album không có ảnh thì lấy ảnh ngẫu nhiên từ coverImages để không bị lỗi tàng hình
            const fallbackImg = coverImages[idx % coverImages.length];
            const imgSrc = album.img || fallbackImg; 
            carouselContainer.innerHTML += `<div class="thumb-card" data-index="${idx}"><img src="${imgSrc}" loading="lazy" class="w-full h-full object-cover"></div>`;
        });
        thumbsArray = Array.from(carouselContainer.querySelectorAll(".thumb-card"));
        thumbsArray.forEach((thumb, idx) => {
            thumb.addEventListener("click", () => { if (idx !== currentAlbumIndex) window.loadAlbumToPlayer(idx); });
        });
    }

    function renderLyrics() {
        lyricsContainer.innerHTML = `<div class="py-4 space-y-6">${playerLyrics.map((line, index) => `<p class="lyric-line font-serif text-xl lg:text-2xl ${index === 2 ? "active" : "text-white/30"} cursor-pointer hover:text-white/70">${line}</p>`).join("")}</div>`;
    }

    window.loadAlbumToPlayer = (index) => {
        if (!currentArtistData?.albums?.length) return;
        if (index < 0) index = currentArtistData.albums.length - 1;
        if (index >= currentArtistData.albums.length) index = 0;

        currentAlbumIndex = index;
        const album = currentArtistData.albums[currentAlbumIndex];

        detailAlbumArtist.innerText = currentArtistData.name;
        detailAlbumTitle.innerText = album.title;

        gsap.to([bgImage, albumArt, vinylCenter], {
            opacity: 0, duration: 0.25,
            onComplete: () => {
                if(bgImage) bgImage.src = album.img;
                if(albumArt) albumArt.src = album.img;
                if(vinylCenter) vinylCenter.src = album.img;
                gsap.to([bgImage, albumArt, vinylCenter], { opacity: 1, duration: 0.35 });
            }
        });

        thumbsArray.forEach((thumb, idx) => {
            thumb.className = "thumb-card";
            if (idx === currentAlbumIndex) thumb.classList.add("thumb-active");
            else if (idx === currentAlbumIndex - 1 || (currentAlbumIndex === 0 && idx === thumbsArray.length - 1)) thumb.classList.add("thumb-prev");
            else if (idx === currentAlbumIndex + 1 || (currentAlbumIndex === thumbsArray.length - 1 && idx === 0)) thumb.classList.add("thumb-next");
            else thumb.classList.add("thumb-hidden");
        });

        renderLyrics(); resetPlaybackState(); window.updatePlayerUI();
    };

    window.renderTracks = () => {
        if (!currentArtistData?.albums?.length) return;
        const album = currentArtistData.albums[currentAlbumIndex];
        tracklistContainer.innerHTML = "";

        album.tracks.forEach((track, index) => {
            const trackNumber = (index + 1).toString().padStart(2, "0");
            const isSelected = window.hasTrackSelection && index === window.globalCurrentTrackIndex;
            const isPlayingTrack = isSelected && window.isGlobalPlaying;

            const defaultIcon = isPlayingTrack
            ? `<div class="equalizer w-4 flex justify-center items-end group-hover:hidden"><div class="equalizer-bar"></div><div class="equalizer-bar"></div><div class="equalizer-bar"></div></div>`
            : `<span class="text-white/40 text-xs font-serif italic w-4 flex justify-center group-hover:hidden transition-opacity duration-300">${trackNumber}</span>`;
        const hoverIcon = isPlayingTrack
            ? `<i class="ph-fill ph-pause text-white hidden group-hover:flex justify-center w-4 text-base transition-transform duration-300 group-hover:scale-110"></i>`
            : `<i class="ph-fill ph-play text-white hidden group-hover:flex justify-center w-4 text-base transition-transform duration-300 group-hover:scale-110 ml-0.5"></i>`;

        tracklistContainer.innerHTML += `
            <div onclick="playTrack(${index})" class="flex items-center justify-between p-3 md:p-4 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer group border border-transparent hover:border-white/10 backdrop-blur-sm ${isSelected ? "bg-white/10 border-white/10" : ""}">
                <div class="flex items-center gap-4">
                    <div class="w-6 h-6 rounded-full border border-transparent group-hover:border-white/30 group-hover:bg-white/10 flex justify-center items-center relative transition-all duration-300 pointer-events-none">${defaultIcon}${hoverIcon}</div>
                    <span class="${isSelected ? "text-white" : "text-white/70 group-hover:text-white"} font-medium text-sm md:text-base transition-colors pointer-events-none tracking-wide">${track.title}</span>
                </div>
                <span class="${isSelected ? "text-white/80" : "text-white/30 group-hover:text-white/60"} text-xs md:text-sm tracking-wide pointer-events-none transition-colors">${track.time}</span>
            </div>`;
        });
    };

    // =========================================================================
    // ENGINE VIDEO CROSSFADE CHUẨN ĐIỆN ẢNH (HÒA ÂM & HÒA ẢNH)
    // =========================================================================
    function updateVideoBackground(track) {
        if (!bgVideo1 || !bgVideo2) return;
        
        let newVideoSrc = track.videoSrc;

        if (!newVideoSrc) {
            // Đã cập nhật chính xác tên file theo ảnh bạn chụp!
            const minVideos = [
                "./singer/MIN/sound/fragile-intro.mp4",               // Track 01
                "./singer/MIN/sound/qua-muon.mp4",                    // Track 02
                "./singer/MIN/sound/loser-chillies.mp4",              // Track 03
                "./singer/MIN/sound/phai-viet-bao-nhieu-ban-tinh-ca.mp4", // Track 04
                "./singer/MIN/sound/che-do-im-lang.mp4",               // Track 05
                "./singer/MIN/sound/dieu-em-kho-noi.mp4",              // Track 06
                "./singer/MIN/sound/ilysmbihtlyg-interlude.mp4", // Track 07
                "./singer/MIN/sound/chang-phai-tinh-dau-sao-dau-den-the.mp4",// Track 08
                "./singer/MIN/sound/boyfriend-girlfriend.mp4", // Track 09
                "./singer/MIN/sound/co-em-la-nha.mp4"              // Track 10
            ];
            newVideoSrc = minVideos[window.globalCurrentTrackIndex] || "./singer/MIN/sound/qua-muon.mp4";
        }
        
        const oldVid = activeVideoLayer === 1 ? bgVideo1 : bgVideo2;
        activeVideoLayer = activeVideoLayer === 1 ? 2 : 1;
        const newVid = activeVideoLayer === 1 ? bgVideo1 : bgVideo2;
        
        gsap.killTweensOf([oldVid, newVid]);

        newVid.src = newVideoSrc;
        newVid.volume = 0; 
        
        const playPromise = newVid.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                const targetVol = window.isMuted ? 0 : window.globalVolume;
                gsap.to(newVid, { opacity: 0.4, volume: targetVol, duration: 1.5, ease: "power2.inOut", overwrite: "auto" });
                
                if(!oldVid.paused) {
                    gsap.to(oldVid, { opacity: 0, volume: 0, duration: 1.5, ease: "power2.inOut", overwrite: "auto", onComplete: () => {
                        oldVid.pause();
                        oldVid.currentTime = 0;
                    }});
                }
            }).catch(e => {
                console.log("Lỗi tải nhạc (sai tên file):", e);
            });
        }
    }

    // PHÁT NHẠC NGẦM (Không mở đĩa than)
    window.playTrackSilently = (albumIndex, trackIndex) => {
        window.isMiniPlayerClosed = false; // Mở lại mini player nếu đang tắt
        if(currentArtistData.initialIndex !== albumIndex) {
            currentArtistData.initialIndex = albumIndex;
            currentAlbumIndex = albumIndex;
        }
        
        window.globalCurrentTrackIndex = trackIndex;
        window.hasTrackSelection = true;
        window.isGlobalPlaying = true;
        
        const track = getActiveTrack();
        updateVideoBackground(track); 
        window.updatePlayerUI();
    };

    window.playAlbumSilently = (albumIndex) => {
        window.playTrackSilently(albumIndex, 0);
    };

    window.playNextTrack = () => {
        if (!currentArtistData?.albums) return;
        const album = currentArtistData.albums[currentAlbumIndex];
        let nextIndex = window.globalCurrentTrackIndex + 1;
        if (nextIndex >= album.tracks.length) nextIndex = 0; // Hết album thì quay lại bài 1
        window.playTrackSilently(currentAlbumIndex, nextIndex);
    };

    window.playPrevTrack = () => {
        if (!currentArtistData?.albums) return;
        const album = currentArtistData.albums[currentAlbumIndex];
        let prevIndex = window.globalCurrentTrackIndex - 1;
        if (prevIndex < 0) prevIndex = album.tracks.length - 1;
        window.playTrackSilently(currentAlbumIndex, prevIndex);
    };

    function startSmoothProgress() {
        const update = () => {
            const player = getMainPlayer();
            if (player && !player.paused) {
                const current = player.currentTime;
                const total = player.duration || 1;
                window.currentProgress = (current / total) * 100;
                
                if (progressBar) progressBar.style.width = `${window.currentProgress}%`;
                if (currentTimeEl) currentTimeEl.innerText = formatRealTime(current);
                
                // CẬP NHẬT CHO MINI PLAYER
                const miniProg = document.getElementById("mini-progress-bar");
                const miniTime = document.getElementById("mini-current-time");
                if (miniProg) miniProg.style.width = `${window.currentProgress}%`;
                if (miniTime) miniTime.innerText = formatRealTime(current);
                
                animationFrameId = requestAnimationFrame(update);
            }
        };
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(update);
    }

    const onTrackEnded = () => {
        const album = currentArtistData.albums[currentAlbumIndex];
        const nextTrackIndex = window.globalCurrentTrackIndex + 1;
        if (nextTrackIndex >= album.tracks.length) {
            window.isGlobalPlaying = false;
            window.updatePlayerUI();
            return;
        }
        window.playNextTrack();
    };
    bgVideo1?.addEventListener("ended", onTrackEnded);
    bgVideo2?.addEventListener("ended", onTrackEnded);

    const onMetaLoaded = (e) => {
        if(e.target === getMainPlayer() && totalTimeEl) {
            totalTimeEl.innerText = formatRealTime(e.target.duration);
        }
    };
    bgVideo1?.addEventListener("loadedmetadata", onMetaLoaded);
    bgVideo2?.addEventListener("loadedmetadata", onMetaLoaded);

    // Hàm kiểm tra hiển thị Mini Player
    window.closeMiniPlayer = () => {
        window.isMiniPlayerClosed = true;
        globalMiniPlayer.classList.add("translate-y-[200%]", "opacity-0");
        globalMiniPlayer.classList.remove("translate-y-0", "opacity-100");
        
        // CẬP NHẬT: Tắt nhạc và dừng video khi bấm Close
        const player = getMainPlayer();
        if (player) player.pause();
        window.isGlobalPlaying = false;
        window.updatePlayerUI();
    };

    window.checkMiniPlayerVisibility = () => {
        const currentView = getCurrentViewKey();
        if (window.hasTrackSelection && currentView !== "product" && !window.isMiniPlayerClosed) {
            const track = getActiveTrack();
            const album = currentArtistData.albums[currentAlbumIndex];
            miniPlayerTitle.innerText = track ? track.title : "Unknown Track";
            miniPlayerArtist.innerText = currentArtistData.name;
            miniPlayerImg.src = album.img;

            globalMiniPlayer.classList.remove("translate-y-[200%]", "opacity-0");
            globalMiniPlayer.classList.add("translate-y-0", "opacity-100");
        } else {
            globalMiniPlayer.classList.add("translate-y-[200%]", "opacity-0");
            globalMiniPlayer.classList.remove("translate-y-0", "opacity-100");
        }
    };

    // Khi click vào Mini Player, mở lại đĩa nhạc
    globalMiniPlayer?.addEventListener("click", () => {
        window.switchView(getCurrentViewKey(), "product", animateProductIntro);
    });

    window.updatePlayerUI = () => {
        // Hàm xử lý hiệu ứng Pop-in cho Icon
        const updateIconState = (el, isPlaying, isPopTrack = false) => {
            if (!el) return;
            const wasPlaying = el.classList.contains("ph-pause");
            if (isPlaying && !wasPlaying) {
                el.classList.replace("ph-play", "ph-pause"); 
                el.classList.remove("ml-1", "ml-0.5");
                el.classList.remove("animate-pop"); void el.offsetWidth; el.classList.add("animate-pop");
            } else if (!isPlaying && wasPlaying) {
                el.classList.replace("ph-pause", "ph-play"); 
                if (isPopTrack) el.classList.add("ml-0.5"); else el.classList.add("ml-1");
                el.classList.remove("animate-pop"); void el.offsetWidth; el.classList.add("animate-pop");
            }
        };

        // 1. Đồng bộ Nút chính & Mini Player
        updateIconState(mainPlayIcon, window.isGlobalPlaying);
        updateIconState(miniPlayIcon, window.isGlobalPlaying);

        // 2. Đồng bộ Nút To ở đầu trang Nghệ sĩ
        const artistPlayIcon = document.getElementById("artist-play-icon");
        if (artistPlayIcon) updateIconState(artistPlayIcon, window.isGlobalPlaying);

        // 3. Đồng bộ Danh sách Album & Track phổ biến
        if (currentArtistData && currentArtistData.albums) {
            currentArtistData.albums.forEach((album, aIdx) => {
                const albIcon = document.getElementById(`album-play-${aIdx}`);
                if (albIcon) updateIconState(albIcon, window.isGlobalPlaying && currentAlbumIndex === aIdx);

                album.tracks.forEach((track, tIdx) => {
                    const popIcon = document.getElementById(`popular-play-${aIdx}-${tIdx}`);
                    const popNum = document.getElementById(`popular-num-${aIdx}-${tIdx}`);
                    if (popIcon) {
                        const isPlayingThisTrack = (window.isGlobalPlaying && currentAlbumIndex === aIdx && window.globalCurrentTrackIndex === tIdx);
                        updateIconState(popIcon, isPlayingThisTrack, true);
                        
                        // Ép hiển thị icon Pause cố định khi bài hát đang phát
                        if (isPlayingThisTrack) {
                            if (popNum) popNum.style.opacity = "0";
                            popIcon.style.opacity = "1";
                        } else {
                            if (popNum) popNum.style.opacity = "";
                            popIcon.style.opacity = "";
                        }
                    }
                });
            });
        }

        // 4. Xử lý Đĩa than xoay & Tiến trình
        if (window.isGlobalPlaying && window.hasTrackSelection) {
            detailVinyl?.classList.add("is-playing");
            startSmoothProgress();
        } else {
            detailVinyl?.classList.remove("is-playing");
            cancelAnimationFrame(animationFrameId);
        }
        window.renderTracks();
        checkMiniPlayerVisibility(); 

        // ... (code cũ của hàm updatePlayerUI)
        if (window.isGlobalPlaying && window.hasTrackSelection) {
            detailVinyl?.classList.add("is-playing");
            startSmoothProgress();
        } else {
            detailVinyl?.classList.remove("is-playing");
            cancelAnimationFrame(animationFrameId);
        }
        window.renderTracks();
        checkMiniPlayerVisibility(); 
    };
    window.playTrack = (trackIndex) => {
        if (!currentArtistData?.albums?.length || !bgVideo1) return;

        const isSameTrack = (window.hasTrackSelection && window.globalCurrentTrackIndex === trackIndex);
        if (isSameTrack) { window.togglePlay(); return; }

        window.globalCurrentTrackIndex = trackIndex;
        window.hasTrackSelection = true;
        window.isGlobalPlaying = true;
        
        const track = getActiveTrack();
        updateVideoBackground(track); 
        window.updatePlayerUI();
    };

    window.togglePlay = () => {
        if (!currentArtistData?.albums?.length || !bgVideo1) return;
        if (!window.hasTrackSelection) { window.playTrack(0); return; }
        
        const player = getMainPlayer();
        if (player.paused) {
            player.play(); window.isGlobalPlaying = true;
        } else {
            player.pause(); window.isGlobalPlaying = false;
        }
        window.updatePlayerUI();
    };

    window.toggleGlobalPlay = () => {
        if (!currentArtistData?.albums?.length) return;
        if (!window.hasTrackSelection) { window.playAlbumSilently(0); return; }
        window.togglePlay();
    };

    window.toggleTrackFromArtist = (aIdx, tIdx) => {
        if (window.hasTrackSelection && window.currentAlbumIndex === aIdx && window.globalCurrentTrackIndex === tIdx) {
            window.togglePlay();
        } else { window.playTrackSilently(aIdx, tIdx); }
    };

    window.toggleAlbumFromArtist = (aIdx) => {
        if (window.hasTrackSelection && window.currentAlbumIndex === aIdx) {
            window.togglePlay();
        } else { window.playAlbumSilently(aIdx); }
    };

    window.seekTrack = (event) => {
        if (!currentArtistData?.albums?.length || !window.hasTrackSelection) return;

        const player = getMainPlayer();
        const container = document.getElementById("progress-container");
        const rect = container.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percent = Math.max(0, Math.min(clickX / rect.width, 1));
        
        const targetTime = percent * player.duration;
        if (isFinite(targetTime)) {
            player.currentTime = targetTime;
            window.currentProgress = percent * 100;
            progressBar.style.width = `${window.currentProgress}%`;
            currentTimeEl.innerText = formatRealTime(targetTime);
        }
    };

    window.toggleMute = () => {
        window.isMuted = !window.isMuted;
        const player = getMainPlayer();
        const percent = window.isMuted ? 0 : window.globalVolume;
        if (player) player.volume = percent;
        
        if (document.getElementById("volume-bar")) document.getElementById("volume-bar").style.width = `${percent * 100}%`;
        if (document.getElementById("mini-volume-bar")) document.getElementById("mini-volume-bar").style.width = `${percent * 100}%`;
        const volPercentText = document.getElementById("volume-percent");
        if (volPercentText) volPercentText.innerText = `${Math.round(percent * 100)}%`;

        const iconClass = percent === 0 ? "ph-fill ph-speaker-slash text-lg" : "ph-fill ph-speaker-high text-lg";
        const miniIconClass = percent === 0 ? "ph-fill ph-speaker-slash text-white/40 hover:text-white transition-colors text-sm" : "ph-fill ph-speaker-high text-white/40 hover:text-white transition-colors text-sm";
        if (document.getElementById("volume-icon")) document.getElementById("volume-icon").className = iconClass;
        if (document.getElementById("mini-volume-icon")) document.getElementById("mini-volume-icon").className = miniIconClass;
    };
    window.seekVolume = (event) => {
        const container = document.getElementById("volume-container");
        const rect = container.getBoundingClientRect();
        let percent = Math.max(0, Math.min((event.clientX - rect.left) / rect.width, 1));
        
        window.globalVolume = percent;
        window.isMuted = percent === 0;

        const player = getMainPlayer();
        if (player) player.volume = window.globalVolume;

        document.getElementById("volume-bar").style.width = `${window.globalVolume * 100}%`;
        const volIcon = document.getElementById("volume-icon");
        
        if (window.isMuted) volIcon.classList.replace("ph-speaker-high", "ph-speaker-none");
        else volIcon.classList.replace("ph-speaker-none", "ph-speaker-high");
    };

    window.switchTab = (tab) => {
        const trackTab = document.getElementById("tab-tracks"); const lyricTab = document.getElementById("tab-lyrics");
        if (tab === "tracks") {
            trackTab.classList.add("text-white"); trackTab.classList.remove("text-white/40");
            lyricTab.classList.add("text-white/40"); lyricTab.classList.remove("text-white");
            lyricsContainer.classList.add("opacity-0", "pointer-events-none"); tracklistContainer.classList.remove("opacity-0", "pointer-events-none");
            return;
        }
        lyricTab.classList.add("text-white"); lyricTab.classList.remove("text-white/40");
        trackTab.classList.add("text-white/40"); trackTab.classList.remove("text-white");
        tracklistContainer.classList.add("opacity-0", "pointer-events-none"); lyricsContainer.classList.remove("opacity-0", "pointer-events-none");
    };

    btnExplore?.addEventListener("click", () => { window.switchView("home", "catalog", animateCatalogIntro); });
    btnMenu?.addEventListener("click", () => { if (isMenuOpen) closeMenuState(); else openMenuState(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && isMenuOpen) closeMenuState(); });
    btnThumbPrev?.addEventListener("click", () => { if (typeof currentAlbumIndex !== "undefined") window.loadAlbumToPlayer(currentAlbumIndex - 1); });
    btnThumbNext?.addEventListener("click", () => { if (typeof currentAlbumIndex !== "undefined") window.loadAlbumToPlayer(currentAlbumIndex + 1); });

    if (customCursor) {
        document.body.classList.add("no-cursor");
        document.addEventListener("mousemove", (event) => { gsap.to(customCursor, { x: event.clientX, y: event.clientY, duration: 0.08, overwrite: "auto" }); });
    }

    if (overlayMenu) { overlayMenu.classList.remove("-translate-x-full"); gsap.set(overlayMenu, { xPercent: -100 }); }

    showView("home"); renderCatalog(); renderLyrics(); window.refreshScrollRows();

    const loaderTimeline = gsap.timeline();
    loaderTimeline
        .fromTo(".loader-text", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 })
        .to("#loader-progress", { width: "100%", duration: 1.2, ease: "power2.inOut" })
        .to(".loader-text", { opacity: 0, duration: 0.3 })
        .to("#loader-bar-wrapper", { width: "100vw", duration: 0.5, ease: "power3.inOut" })
        .to("#preloader", {
            y: "-100%", duration: 0.8, ease: "expo.inOut",
            onComplete: () => {
                const preloader = document.getElementById("preloader");
                if (preloader) preloader.remove();
                const homeFooter = viewHome.querySelector(".global-footer");
                if (homeFooter) gsap.to(homeFooter, { opacity: 1, duration: 0.8 });
            }
        })
        .fromTo(".home-bg", { scale: 1.12 }, { scale: 1, duration: 1.8, ease: "power2.out" }, "-=0.7")
        .fromTo(".home-anim", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.18, ease: "power2.out" }, "-=0.9");
});