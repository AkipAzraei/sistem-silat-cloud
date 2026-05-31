const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

// Data awal (Boleh diedit oleh Ketua Juri nanti)
let dataPerlawanan = {
    kelas: "Kelas A Putera",
    merah: { nama: "Muhammad Ali", pertubuhan: "Seni Gayong", mata: 0, binaan: 0, amaran: 0, berat: 0 },
    biru: { nama: "Ahmad Jidin", pertubuhan: "Cekak Hanafi", mata: 0, binaan: 0, amaran: 0, berat: 0 }
};

let logTekananJuri = [];

io.on('connection', (socket) => {
    socket.emit('kemaskini_skrin', dataPerlawanan);
    socket.emit('kemaskini_log_ketua', logTekananJuri);

    // FUNGSI BARU: Terima maklumat edit daripada Ketua Juri
    socket.on('kemaskini_maklumat', (data) => {
        dataPerlawanan.kelas = data.kelas;
        dataPerlawanan.merah.nama = data.namaMerah;
        dataPerlawanan.merah.pertubuhan = data.clubMerah;
        dataPerlawanan.biru.nama = data.namaBiru;
        dataPerlawanan.biru.pertubuhan = data.clubBiru;

        // Hantar maklumat baru ke SEMUA skrin (Skrin Utama & Juri)
        io.emit('kemaskini_skrin', dataPerlawanan);
    });

    socket.on('tambah_mata', (data) => {
        let tambah = 0;
        if(data.jenis === 'tumbukan') tambah = 1;
        if(data.jenis === 'sepakan') tambah = 2;
        if(data.jenis === 'jatuhan') tambah = 3;

        dataPerlawanan[data.sudut].mata += tambah;

        logTekananJuri.unshift({
            masa: new Date().toLocaleTimeString(),
            juri: `Juri ${data.juri}`,
            tindakan: `+${tambah} Mata (${data.jenis.toUpperCase()}) kepada Sudut ${data.sudut.toUpperCase()}`
        });

        if(logTekananJuri.length > 10) logTekananJuri.pop();

        io.emit('kemaskini_skrin', dataPerlawanan);
        io.emit('kemaskini_log_ketua', logTekananJuri);
    });

    socket.on('tambah_kesalahan', (data) => {
        let mesejLog = "";
        if(data.jenis === 'binaan') {
            if(dataPerlawanan[data.sudut].binaan < 2) dataPerlawanan[data.sudut].binaan += 1;
            mesejLog = `Binaan diberikan kepada Sudut ${data.sudut.toUpperCase()}`;
        } else if(data.jenis === 'amaran') {
            dataPerlawanan[data.sudut].amaran += 1;
            dataPerlawanan[data.sudut].mata -= 1;
            mesejLog = `Amaran (-1) diberikan kepada Sudut ${data.sudut.toUpperCase()}`;
        } else if(data.jenis === 'berat') {
            dataPerlawanan[data.sudut].berat += 1;
            dataPerlawanan[data.sudut].mata -= 5;
            mesejLog = `KESALAHAN BERAT (-5) diberikan kepada Sudut ${data.sudut.toUpperCase()}`;
        }

        logTekananJuri.unshift({
            masa: new Date().toLocaleTimeString(),
            juri: `Juri ${data.juri}`,
            tindakan: mesejLog
        });

        io.emit('kemaskini_skrin', dataPerlawanan);
        io.emit('kemaskini_log_ketua', logTekananJuri);
    });

    socket.on('reset_perlawanan', () => {
        dataPerlawanan.merah.mata = 0; dataPerlawanan.merah.binaan = 0; dataPerlawanan.merah.amaran = 0; dataPerlawanan.merah.berat = 0;
        dataPerlawanan.biru.mata = 0; dataPerlawanan.biru.binaan = 0; dataPerlawanan.biru.amaran = 0; dataPerlawanan.biru.berat = 0;
        logTekananJuri = [];
        io.emit('kemaskini_skrin', dataPerlawanan);
        io.emit('kemaskini_log_ketua', logTekananJuri);
    });
});

const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Server Silat Offline berjalan di http://localhost:${PORT}`);
});