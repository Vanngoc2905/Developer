import { db } from '../firebase/firebaseConfig';
import { ref, get, set } from 'firebase/database';

export const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

export const checkIsVip = async (username) => {
    const snap = await get(ref(db, `users/${username}/subscription`));
    if (snap.exists()) {
        const sub = snap.val();
        if (sub.expiresAt && sub.expiresAt > Date.now()) {
            return true;
        }
    }
    return false;
}

export const getVipInfo = async (username) => {
    const snap = await get(ref(db, `users/${username}/subscription`));
    return snap.exists() ? snap.val() : null;
}

// Kiểm tra giới hạn TẠO Meme (Max 5 / ngày nếu ko phải VIP)
export const checkCreateLimit = async (username) => {
    const isVip = await checkIsVip(username);
    if (isVip) return { allowed: true, isVip: true };

    const today = getTodayStr();
    const snap = await get(ref(db, `users/${username}/dailyUsage/${today}/createdCount`));
    const count = snap.exists() ? snap.val() : 0;
    
    if (count >= 5) return { allowed: false, remaining: 0 };
    return { allowed: true, remaining: 5 - count };
}

export const incrementCreateCount = async (username) => {
    const today = getTodayStr();
    const snap = await get(ref(db, `users/${username}/dailyUsage/${today}/createdCount`));
    const count = snap.exists() ? snap.val() : 0;
    await set(ref(db, `users/${username}/dailyUsage/${today}/createdCount`), count + 1);
}

// Kiểm tra giới hạn GỬI Meme (Max 10 / ngày nếu ko phải VIP)
export const checkSendLimit = async (username) => {
    const isVip = await checkIsVip(username);
    if (isVip) return { allowed: true, isVip: true };

    const today = getTodayStr();
    const snap = await get(ref(db, `users/${username}/dailyUsage/${today}/sentCount`));
    const count = snap.exists() ? snap.val() : 0;
    
    if (count >= 10) return { allowed: false, remaining: 0 };
    return { allowed: true, remaining: 10 - count };
}

export const incrementSendCount = async (username) => {
    const today = getTodayStr();
    const snap = await get(ref(db, `users/${username}/dailyUsage/${today}/sentCount`));
    const count = snap.exists() ? snap.val() : 0;
    await set(ref(db, `users/${username}/dailyUsage/${today}/sentCount`), count + 1);
}

// Mua gói VIP
export const buyPackage = async (username, packageType) => {
    const now = Date.now();
    let duration = 0;
    let price = 0;
    let name = '';
    
    if (packageType === 'WEEK') { duration = 7 * 24 * 60 * 60 * 1000; price = 100000; name = 'Gói Tuần'; }
    else if (packageType === 'MONTH') { duration = 30 * 24 * 60 * 60 * 1000; price = 450000; name = 'Gói Tháng'; }
    else if (packageType === 'YEAR') { duration = 365 * 24 * 60 * 60 * 1000; price = 1000000; name = 'Gói Năm'; }

    // Cộng dồn hạn (nếu còn)
    const vipInfo = await getVipInfo(username);
    let newExpiresAt = now + duration;
    if (vipInfo && vipInfo.expiresAt && vipInfo.expiresAt > now) {
        newExpiresAt = vipInfo.expiresAt + duration;
    }

    const subData = {
        active: true,
        packageId: packageType,
        purchasedAt: now,
        expiresAt: newExpiresAt
    };

    await set(ref(db, `users/${username}/subscription`), subData);
    
    // Ghi nhận hóa đơn
    const txId = `INV-${Math.floor(Math.random() * 1000000)}`;
    const txData = {
        txId,
        username,
        packageType,
        packageName: name,
        amount: price,
        timestamp: now
    };
    await set(ref(db, `transactions/${txId}`), txData);

    return txData;
}
