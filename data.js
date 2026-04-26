// ====== 1. IMPORT DỮ LIỆU TỪ CÁC FILE CA SĨ ====== //
import { MIN } from './singer/MIN/MIN.js';
import { Parys } from './singer/Parys/Parys.js';
// import { AnhTu } from './singer/AnhTu/AnhTu.js'; // Khi nào có file Anh Tú thì mở comment dòng này

// ====== 2. KHỞI TẠO CƠ SỞ DỮ LIỆU ====== //
export const musicDatabase = {
    "MIN": MIN,
    "Parys": Parys,
    // "Anh Tú": AnhTu, // Gắn thêm vào đây
};

// ====== 3. CẤU HÌNH DANH MỤC (CATEGORIES) ====== //
export const categories = [
    {
        title: "Tuyển tập Nghệ sĩ Việt",
        desc: "Những giọng ca hàng đầu V-Pop hiện nay",
        itemType: "artist",
        items: ["MIN", "Parys", "Vũ.", "Da Lab", "14 Casper", "buitruonglinh", "Hoàng Dũng", "Hngle", "Issac", "Dfoxie37", "Changg", "Rhymasitc", "Thee Sheep", "Monstar", "Low G", "Obito", "WILLISTIC", "Dab"]
    },
    {
        title: "International Icons",
        desc: "Global chart-toppers and legends",
        itemType: "artist",
        items: ["Jung Kook", "1nonly", "JVKE", "Ed Sheeran", "Lauv", "Charlie Puth"]
    },
    {
        title: "Rap & Hip-Hop",
        desc: "Flow cực cuốn, beat cực cháy",
        itemType: "album", 
        items: ["Top Rap Việt", "Underground Vibe", "Chill Hip-Hop", "Rap Love Mix", "Trap & Bass"] 
    },
    {
        title: "R&B Vibes",
        desc: "Giai điệu R&B mượt mà, gợi cảm",
        itemType: "album", 
        items: ["Late Night R&B", "Smooth Vibes", "Viet R&B Hits", "Soul & Love"] 
    },
    {
        title: "Indie Corner",
        desc: "Góc âm nhạc Indie cực chill",
        itemType: "album", 
        items: ["Indie Chillout", "Acoustic Indie", "Cà Phê Sáng", "Giai điệu Mùa Thu"] 
    }
];

// ====== 4. ẢNH MẶC ĐỊNH (FALLBACK IMAGES) ====== //
export const coverImages = [
    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800",
    "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?q=80&w=800",
    "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f4b0?q=80&w=800",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800"
];