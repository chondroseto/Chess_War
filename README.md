# Chess War

Deskripsi
----------
Chess War adalah versi sederhana dari permainan catur yang diperkaya dengan elemen strategi area dan toko (shop). Pemain bergantian melakukan langkah tradisional catur. Selain itu, pemain dapat menguasai kotak dengan menempatkan bidak di sana beberapa giliran berturut-turut, mengumpulkan "koin" dari kotak yang dikuasai, dan membeli bidak baru atau menembakkan misil untuk menghancurkan kepemilikan lawan.

Fitur utama
-----------
- Papan catur 8x8 dengan bidak standar: King, Queen, Rook, Bishop, Knight, Pawn
- Sistem giliran: bergantian antara White (P1) dan Black (P2)
- Gerakan legal dasar untuk setiap bidak (pawn, knight, bishop, rook, queen, king)
- Promosi pion otomatis menjadi queen saat sampai baris akhir
- Sistem "occupy" (kepemilikan kotak): berdiri di kotak selama 2 giliran untuk menguasainya
- Koin: tiap kotak yang dikuasai memberi 1 koin ke pemiliknya setiap akhir giliran
- Toko: belanja bidak (Pawn, Knight, Bishop, Rook, Queen) menggunakan koin; bidak yang dibeli langsung ditempatkan ke kotak kosong yang sudah dikuasai pemain
- Misil: beli dan gunakan untuk menghancurkan kepemilikan (mengosongkan dan mereset kotak), juga menghapus bidak yang ada di sana

Cara main (aturan singkat)
-------------------------
1. Pemain bergiliran bergerak seperti catur biasa. Klik bidak milikmu untuk melihat langkah legal, lalu klik kotak tujuan untuk memindahkannya.
2. Setelah melakukan langkah, sistem "occupy" diperbarui: berdiri selama dua giliran berturut-turut pada sebuah kotak akan menjadikannya dimiliki oleh pemain yang berdiri di sana.
3. Di akhir giliran, setiap kotak yang dikuasai memberi 1 koin pada pemiliknya.
4. Koin dapat digunakan di panel toko:
	 - Pawn (P): 1 koin
	 - Knight (N): 3 koin
	 - Bishop (B): 3 koin
	 - Rook (R): 5 koin
	 - Queen (Q): 9 koin
	 - Missile: 4 koin
5. Untuk membeli: pilih item di toko, lalu klik kotak kosong yang sudah dikuasai untuk menempatkan bidak yang dibeli. Membeli mengakhiri giliran.
6. Untuk membeli misil: pilih misil lalu klik kotak manapun yang dikuasai (owner) untuk menembakkan misil ke sana. Misil menghapus kepemilikan dan bidak pada kotak yang diserang. Menggunakan misil juga mengakhiri giliran.

Antarmuka & Kontrol
-------------------
- Klik bidak milikmu untuk memilihnya dan melihat langkah legal.
- Klik kotak kosong yang disorot untuk memindahkan/menempatkan bidak.
- Klik tombol toko untuk memasuki mode pembelian.
- Tombol "Cancel" untuk membatalkan mode pembelian.
- Tombol "Reset" untuk mengembalikan posisi awal catur.

Cara menjalankan
----------------
Situs ini adalah aplikasi statis. Buka berkas `index.html` di browser untuk memainkannya.

Jika ingin menjalankan server lokal cepat (opsional), jalankan salah satu perintah ini di direktori proyek:

PowerShell / Command Prompt (jika Python terpasang):

```powershell
python -m http.server 8000
```

Lalu buka: http://localhost:8000/

Catatan teknis singkat
---------------------
- File utama:
	- `index.html` — markup dan tautan ke skrip/stylesheet
	- `script.js` — logika permainan (setup, render, gerakan, toko, occupy, koin, dll.)
	- `styles.css` — gaya tampilan papan dan elemen UI
- Representasi board: matriks 8x8 di `script.js` (nilai null atau kode bidak seperti 'P','n', dll.)
- Pemain putra (white) menggunakan huruf kapital, pemain gelap (black) huruf kecil.

Batasan / Hal yang belum diimplementasikan
-----------------------------------------
- Tidak ada deteksi/penanganan check atau checkmate — permainan tidak otomatis mendeklarasikan skakmat.
- Castling dan en passant belum didukung.
- Pawn double-step en passant capture tidak ada.
- Tidak ada AI; permainan untuk dua pemain lokal (bergantian pada satu papan).

Kontribusi
----------
Jika ingin menambah fitur (mis. deteksi check/checkmate, AI, animasi, suara), silakan fork repo dan ajukan pull request. Sertakan perubahan di `script.js` dan catat kompatibilitas dengan sistem "occupy" dan toko.

Lisensi
-------
Gunakan sesuka hati. Jika ingin distribusi publik, sertakan atribusi sederhana.

Penutup
-------
README ini mencakup ringkasan dan cara menjalankan Chess War. Jika Anda ingin versi README yang lebih singkat atau terjemahan ke Bahasa Inggris, beri tahu saya.
