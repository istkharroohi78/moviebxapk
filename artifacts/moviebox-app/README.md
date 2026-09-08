# MOVIE BOX — Android App (APK)

Ye Capacitor project aapki MOVIE BOX website ko ek asli Android app me badal deta hai.
App ke andar wahi website chalti hai — same design, same player, same Gmail login, same
Movies / Web Series / Cartoon sections. Website update karoge to app apne aap update ho jayega
(nayi APK banane ki zarurat nahi).

- App name: **MOVIE BOX**
- Package id: `com.betabothub.moviebox`

---

## 1. Ek baar ki taiyari (computer par)

Install karo:

1. **Node.js 20+** — https://nodejs.org
2. **Java JDK 17** — https://adoptium.net
3. **Android Studio** — https://developer.android.com/studio
   (install ke waqt "Android SDK" + "Android SDK Platform-Tools" ko tick rakho)

---

## 2. Website ka address daalo

`capacitor.config.json` kholo aur ye line badlo:

```json
"url": "https://YOUR-MOVIEBOX-DOMAIN.com"
```

Yahan apni live MOVIE BOX website ka address likho (jaise `https://moviebox.com`).
Neeche `allowNavigation` me bhi apna domain likh do.

> Website pehle live honi chahiye (Vercel / VPS / apna hosting). App usi ko kholta hai.

---

## 3. App banao

Terminal me is folder me aao aur chalao:

```bash
npm install
npx cap add android
npx cap sync android
```

Ab APK banao:

```bash
cd android
./gradlew assembleDebug        # Windows par: gradlew.bat assembleDebug
```

APK yahan milegi:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Yahi file phone me bhej kar install kar sakte ho (phone me "Unknown sources" allow karna hoga).

---

## 4. Play Store wali signed APK / AAB

```bash
keytool -genkey -v -keystore moviebox.keystore -alias moviebox -keyalg RSA -keysize 2048 -validity 10000
```

`android/key.properties` file banao:

```
storeFile=../../moviebox.keystore
storePassword=YOUR_PASSWORD
keyAlias=moviebox
keyPassword=YOUR_PASSWORD
```

Phir:

```bash
cd android
./gradlew assembleRelease      # signed APK
./gradlew bundleRelease        # Play Store ke liye .aab
```

---

## 5. Icon aur splash

1. `android/app/src/main/res/` me apna logo daalo, ya
2. Aasan tarika:

```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --android
```

Isse pehle `assets/icon.png` (1024x1024) aur `assets/splash.png` (2732x2732) rakh do.

---

## 6. Kuch cheezein yaad rakhna

- **Download**: app ke andar download button Telegram / browser me khulta hai — Android par ye normal hai.
- **Fullscreen player**: pehle se on hai, phone ghumate hi video full screen ho jayega.
- **Back button**: Android ka back button website ke andar peeche jata hai.
- Website ka koi bhi change karoge to app me turant dikhega — dobara APK banane ki zarurat nahi.

---

Made for **MOVIE BOX** — by Beta Bot Hub · https://t.me/betabot_hub

## Human verification (number addition)

- App ke start screen (`www/index.html`) par ek chhota sa addition sawaal hai
  (jaise `4 + 7 = ?`). Sahi jawab dene par hi "Continue to MOVIE BOX" button
  chalu hota hai. `SITE_URL` ko apne domain se badal dena (`www/index.html` me).
- Website par bhi same verification hai: Gmail login code bhejne se pehle aur
  Fast download shuru karne se pehle. Website wala check server par verify hota
  hai, isliye use bypass nahi kiya ja sakta.

---

## Naya: Download, In-app Play, History On/Off, Fullscreen

### 1) Download feature (app ke andar)
Website ke har "Fast download" link ab app ke andar hi download hote hain — Android ka
DownloadManager use hota hai, notification me progress dikhta hai, aur file
`Downloads/MovieBox/` folder me save hoti hai.

Setup:
1. `npx cap add android` chalao.
2. `android-snippets/MainActivity.java` ko copy karke
   `android/app/src/main/java/com/betabothub/moviebox/MainActivity.java` par paste kar do.
3. `android-snippets/AndroidManifest-additions.xml` me di gayi permissions aur
   activity attributes `android/app/src/main/AndroidManifest.xml` me add kar do.
4. `npx cap sync android` phir `npm run build:apk`.

### 2) App me hi play
`MainActivity.java` me media playback settings on hain, isliye video app ke andar hi
chalta hai — koi bahar ka player nahi khulta.

### 3) History On/Off
App ki start screen par "Watch history on" switch hai. Off karne par site ko
`?history=off` ke saath khola jata hai aur kuch bhi save nahi hota.
Website par bhi yeh switch **Account** page me milta hai (history clear ka button bhi).

### 4) Fullscreen
- Start screen par "Open in fullscreen" option.
- Player ke niche "Fullscreen" button (website + app dono me).
- Android me fullscreen par video apne aap landscape aur immersive ho jata hai.

### 5) Gmail yaad rahega
Login page par "Remember my Gmail on this device" tick hota hai, isliye agli baar
email pehle se bhara hua milta hai; sign-in 30 din tak yaad rehta hai.
