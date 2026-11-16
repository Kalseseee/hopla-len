# Hopla Len — V9

Tarayıcıda 2–4 kişilik fizik tabanlı parkur yarışı. Three.js, cannon-es ve PeerJS.

## Oyna

https://skyhop-party.topbookmark2.chatgpt.site

Varsayılan karakter hazırdır; karakter seçmeden oda kurabilir, katılabilir veya antrenmana girebilirsin. Karakterini menüden veya lobideki Karakteri değiştir butonundan değiştirebilirsin. Sonra oda kur, 6 haneli kodu veya davet bağlantısını paylaş. İki oyuncu da V9 kullanmalı. Oda sahibi sekmeyi açık tutmalı.

- WASD / oklar: kameraya göre hareket.
- Space: zıpla.
- Shift: kay.
- E: atıl.
- R: kontrol noktasına dön.
- Fareyi sürükle: kamerayı 360° döndür; tekerlekle yakınlaş/uzaklaş.
- Sağ alttaki ◎: tüm parkuru gör / karaktere dön.

6 prosedürel kostüm, ortalanmış başlangıç, kıvrılan ve yükselen rota, destekli engeller, fiziksel su kaydırağı, yüzdürmeli ve dirençli sığ havuz, atlayışlar ve kontrol noktaları bulunur. Rotanın engeller hariç normal hızda koşulma süresi yaklaşık 55 saniyedir; gerçek süre oyuncuya ve düşüşlere bağlıdır. Yarışta süre sınırı yoktur. İlk oyuncunun bitiş süresi sabitlenir; bağlı olan tüm oyuncular bitirene kadar yarış devam eder. Ayrılan oyuncuların kayıtları sonuçlarda korunur. Oda sahibi yine sekmesini açık tutmalıdır.

## Yerelde başlat

Node.js 20.19+ veya 22.12+ gerekir. ZIP'in tamamını ayrı klasöre çıkarıp `BASLAT.bat` çalıştır. Hazır `dist` dosyaları için npm kurulumu gerekmez. Önce eski 8080 sunucusunu kapat ve tarayıcıda Ctrl+F5 yap.

Geliştirme:

```sh
npm install
npm run dev
```

Derleme: `npm run build`. Test: `node --test tests/*.test.js`.

## Ağ ve fizik

Oda sahibindeki Web Worker fiziği 60 Hz çalıştırır; 20 Hz anlık görüntü gönderir. Girdiler tuş değişiminde anında, ayrıca 20 Hz gönderilir. Kameranın açısı doğrulanarak sunucu tarafındaki hareket yönüne çevrilir. Fizik burada oda sahibinin tarayıcısı tarafından yönetilir; özel oyun sunucusu yoktur. Karakter çarpışmaları yatay çözülür. Başlangıç yuvaları oyuncu sayısına göre merkezlenir. Kayarken fiziksel kapsül alçalır.

WebRTC / herkese açık PeerJS sinyalleşmesi kullanılır. Özel TURN yoktur; bazı VPN/kurumsal/simetrik NAT ağlarında bağlantı kurulamayabilir. Host göçü yoktur. Oda sahibi ayrılırsa oda kapanır; cihaz uyursa veya işletim sistemi sekmeyi tamamen dondurursa oyun durabilir.

## Doğrulama

22 fizik/oturum testi: ortalanmış doğuş, çarpışma, zıplama, kayma, zemin eğimleri, kaydırak, havuz yüzdürmesi, kontrol noktaları, konuk girdi aktarımı ve kameraya göre hareket. İki tarayıcı sekmesinde farklı kostümlerle oda, katılma, ortalı başlangıç, Space zıplama, Shift kayma ve fareyle kamera dönüşü kontrol edildi. Farklı internet ağları arasında test yapılmadı.

## Tasarım ve kaynaklar

Karakterler referanstan esinlenen özgün geometrik modellerdir. Oyun adı Hopla Len'dir; başka oyunların model dosyaları kullanılmamıştır. Altı kostüm: Kasklı, Pofuduk, Canavar, Kahraman, Dino, Şeker.

- Three.js OrbitControls: https://threejs.org/docs/pages/OrbitControls.html
- CatmullRomCurve3: https://threejs.org/docs/pages/CatmullRomCurve3.html
- Su örneği: https://threejs.org/examples/webgl_shaders_ocean.html
- Kütüphane: https://github.com/mrdoob/three.js

Hareket sesleri sağlanan MP3 dosyalarıyla, diğer sesler Web Audio ile, su dalgaları MeshPhysicalMaterial üzerinde zaman tabanlı shader değişikliğiyle üretilir. Three.js, cannon-es ve PeerJS MIT lisanslıdır.

## V5 değişiklikleri

- Karakterler %14 büyütüldü; fizik kapsülleri ve alçak kapılar boyuta uyarlandı.
- Aynı kostüm ve renk seçilse bile oda sahibi herkese farklı bir gövde rengi atar. Bu atama yarış durumunda paylaşılır; tur boyunca sabit kalır. Kostüm seçimi ise korunur.
- Fırlatma pedleri uçuş sırasında 25 birim/s yatay hız verir; koşu limiti uçuşu kesmez. İnişte kontrol geri gelir. İlk bölümde isteğe bağlı kısa yol pedi de vardır.
- Numaralı, ayaklı checkpoint tabelaları ve kayıt çizgileri eklendi; kaydedilen tabela yeşile döner.
- Dev tokmaklar kuvvetli ve yönlü fırlatma uygular. Kinematik çekiçlerin gövde ve sap çarpıştırıcıları vardır.
- İki tahterevalli fiziksel menteşeye bağlı dinamik cisimlerdir. Oyuncu ağırlığıyla eğilir, dengeye döner ve açı sınırıyla aşırı devrilmez.
- Kapı sırası her turda başka bir kırılabilir kapı seçer; diğerleri sağlam kalır. Açılma oda sahibinin anlık görüntülerine yazılır, tüm oyuncular aynı açıklığı görür.
- Ağır, fiziksel bowling topları yaklaşan oyunculara doğru yuvarlanır.
- İki yükseklikte ters yönlü dönen kollar ve normal zıplamayla geçilebilen alçak duvar eklendi.
- Suya dünya koordinatlarında sürekli dalga, gökyüzü yansıması, dinamik parlama, köpük ve oyuncu izleri eklendi. Yüzdürme dalga yüksekliğini izler; su direnci ve hafif akıntı uygulanır.

V5 görsel kontrolü: iki sekmede aynı kostüm/rengin otomatik ayrılması; ayrıca yerel bölüm kontrolünde su, tahterevalli, tokmak, checkpoint ve uzak ped inişi. Farklı internet ağları arasında bağlantı testi yapılmadı.

## V5 geçiş ve arayüz düzeltmesi

- 160. bölümdeki duvar 3,2 yerine 1,1 yüksekliğinde ve 12,8 yerine 8,8 genişliğinde. Kutu kullanmadan normal Space zıplamasıyla geçilir; iki yanda yürünebilen güvenli şeritler vardır.
- Duvarın görsel geometrisi ve çarpıştırıcısı birlikte değiştirildi.
- İsim etiketleri oyuncu rengini taşıyan koyu, yuvarlatılmış ve net yazılı plakalara dönüştürüldü.
- Süre, sıra ve oda kodu üst ortada düşük opaklıklı kompakt bir panelde; ince bir parkur ilerleme çizgisi bulunur.
- Normal zıplama ve zıplamadan yandan geçiş için iki ek regresyon testi başarılı. Toplam 22 test ve üretim derlemesi başarılı. Tarayıcıda gerçek Space/W girdileriyle duvarın üzerinden geçildi; ana oyun arayüzü de kontrol edildi.

## V6: üç parkur ve ortak sonuç ekranı

- Bulut Parkuru korunur. Oda oluşturma veya antrenman öncesinde üç karttan parkur seçilir. Oda sahibinin seçimi konuklara aktarılır ve aynı fizik dünyası Worker içinde oluşturulur.
- Dalga Dengesi (orta): iki fiziksel tahterevalli, yatay hareket eden adalar, dikey asansörler, dar denge köprüleri, su sütunları ve sığ havuzdaki sallar.
- Neon Zirve (zor): yükselen kıvrımlı rota, 2,6 birimlik dar kirişler, hareketli basamaklar, zamanlamalı presler, sarkaçlar, iki seviyeli döner kollar ve periyodik kaybolan platformlar.
- Her iki yeni rotanın engeller hariç koşu uzunluğu yaklaşık 50 saniyedir. Denge, bekleme ve düşüşler gerçek süreyi uzatır; kesin 60 saniyelik geri sayım uygulanmaz.
- Bitiş kapısında BİTİŞ yazar. İlk bitiren, diğer oyuncuyu takip eder; kendi sayacı durur. Herkes bitince kazanan karakter podyumda kutlar; isimler, sıralar ve yüzde bir saniyelik süreler gerçek TextGeometry ile kabartmalı 3D geometri olarak çizilir.
- Kopan katılımcı bekleme koşulundan çıkarılır. Bitiş yaptıysa süresi korunur; tamamlamadıysa AYRILDI görünür. Oda sahibinin ayrılması hâlâ odayı kapatır.
- Üst üste gelen zemin kutuları çizilmez; bitişik fizik döşemelerinin üzerinde ortak köşelerle kesintisiz bir yol yüzeyi, yan duvarlar ve kenar şeritleri çizilir. Böylece renk birleşimlerindeki z-fighting giderilir. Fizik döşemelerindeki küçük örtüşme karakterin ek yerinde takılmasını önlemek için korunur.
- 30 otomatik fizik/oturum/yol/font testi başarılı. İki tarayıcı sekmesinde orta parkura katılma ve konuk hareketi; yerel bölüm denemesinde renk birleşimi, yeni engeller, ilk varışta bekleme ve 3D sonuç ekranı kontrol edildi. Parkurların tamamı iki uzak internet ağıyla oynanmadı.

3D yazılar Bungee Regular fontundan yerel olarak üretilir; Türkçe karakterler dahildir. OFL lisansı: src/assets/FONT-LICENSE.txt. Font kaynağı: https://github.com/google/fonts/tree/main/ofl/bungee. TextGeometry: https://threejs.org/docs/pages/TextGeometry.html.

## V7: bağlantıyı koruyan oda ayarları ve platform düzeltmeleri

- Sonuç sahnesi tam ekran ve daha büyük. Bir tur daha ortada, Lobiye dön ayrı ve belirgin. Konuk da yeni tur isteyebilir; isteği oda sahibinin tarayıcısı işler.
- Yarıştan veya sonuçtan lobiye dönüş oda kodunu ve bağlantıları korur. Her oyuncu adını/karakterini, oda sahibi parkuru değiştirebilir. Ayarlardaki Geri dön kaydetmeden kapatır.
- Sağ üstte Oyundan çık gerçekten odadan ayrılır; oda sahibi ayrılırsa oda kapanır. Alt sağdaki geri dönüş ise ekibi aynı lobide tutar.
- Karakter seçme zorunluluğu kaldırıldı. Katıl, Kaydet ve Geri dön butonları vurgulandı. Parkur ve karakter seçim ekranları yenilendi.
- Zıplamada tüm eksenler ve hareketli platformlar 75 ms gecikmeli ortak durum çiftiyle çizilir. Kamera zıplamayı hafifçe takip eder. İsim etiketleri ortalı ve yüksek çözünürlüklüdür.
- Döndürülmüş sabit platformların başlangıçtaki eski AABB sınırları yenilenir. Zor haritanın sabit yolu yarım birim aralıklarla fizik ışınıyla kontrol edilir.
- Hareketli adalar genişletildi, boyları viraj uzunluğuna uyarlandı, salınım yavaşlatıldı ve çıkışa dördüncü ada eklendi. Kaybolan basamakların boyları da viraja uyarlandı. Üstten iniş için hareketli yüzey süpürme kontrolü ve inişten hemen sonra zıplamak için zemin yakınlığı kontrolü eklendi.
- 37 otomatik test başarılı: önceki 30 test; oda/ayar korunması; varsayılan karakterle giriş; aradeğerleme ve yeni turda geçmişin sıfırlanması; tüm zor sabit zeminler; adaya iniş ve tam hareket döngüsü boyunca üzerinde durma; her ada çifti arasında üç hareket fazında normal zıplama.
- Önceki Windows tarayıcısında iki sekmeyle karakter seçmeden oda kurma/katılma, karakter ve parkur değişimi, konukla lobiye dönüş ve aynı kodla ikinci haritada yeni karakterlerle başlama kontrol edildi. Bölüm denemesinde hareketli adada tutunma/Space zıplaması ve sonuç arayüzü incelendi. Yeni Linux ortamında 37 test ve üretim derlemesi yeniden başarılı; bulut tarayıcısında WebGL kapalı olduğu için 3D görüntü tekrarı yapılamadı. Farklı internet ağları ve tüm parkurun elle bitirilmesi test edilmedi.

## V8: havadan dalma ve yeni fizik bölümleri

- Space ile zıplarken Shift ileri dalar. Aynı anda Space + Shift de çalışır; mevcut yukarı zıplama iptal edilmez. Havadaki dalma yatay hızı 17 birim/s yapar, kısa süre korur ve karakteri uzatır. Her uçuşta bir kez kullanılır; yere inince yaklaşık 0,55 saniyelik kaymaya dönüşür. Kayarken zıplamak da mümkündür.
- Orta ve zor haritada üç şeritli kırılan karo bölümü bulunur. Basılan karo 0,5 saniyede çatlayıp kaybolur ve çarpışması kapanır. 4,5 saniye sonra geri gelir; her şerit bağımsızdır. Altında görünmez sabit zemin yoktur. Bölüm önündeki checkpoint düşüşü kolaylaştırır.
- Dev top yağmurunda sınırlı sayıdaki gerçek dinamik küreler yukarıdaki üç ağızdan sırayla bırakılır. Toplar viraj boyunca geriye yuvarlanır, oyuncuyu savurur ve tekrar kullanılır. Zorda daha fazla ve hızlı top vardır.
- Buz düşük sürtünmeyle ivmeyi korur; S/aşağı hareketin tersine basarak frenler. Hız pedleri ve sonu gerçek boşluk olan yükselen rampalar eklendi. Space ve havada Shift ile açıklık geçilebilir; yönü kaçırmak düşürür.
- Mor tramplenler fiziksel olarak yukarı ve ileri fırlatır, karakter öne takla atar. Alçalırken rakibin üstüne gelmek saldıranı yeniden sektirip rakibi aşağı ve ileri savurur; spamı önleyen bekleme süresi vardır. Karakterler üst üste kule oluşturmaz.
- Duvar ayakları ve pistonları olan boks eldivenleri önce renk uyarısı verir, ardından açılıp oyuncuyu parkur boyunca geriye savurur.
- Karoların aktif/çatlak durumu, topların konumları, yumrukların hareketi, dalma ve takla oda sahibinin ortak durumuyla paylaşılır. Bütün fizik Worker içinde çalışır. Yeni ses efektleri ve sade bölüm işaretleri eklendi.
- Önceki engellerin bazıları yeni bölümlerin alanını boşaltmak için kaldırıldı/taşındı; haritalar aynı uzunluktadır. Gerçek tamamlama süresi oyuncuya ve engellere bağlıdır.
- 47 otomatik test başarılı: önceki 37 test ve 10 yeni test. Aynı anda Space+Shift, artan atlayış mesafesi, tek uçuşta dalma sınırı, iniş kayması, yarım saniyelik karo kırılması ve geri gelmesi, şerit bağımsızlığı, top havuzunun sınırlı kalması, yumruk, tramplen/takla, rakibe üstten vurma, buz freni, hız pedi ve gerçek rampa boşluğu kontrol edilir.
- Windows tarayıcısında gerçek Space+Shift girdisiyle dalma, yeni bölümlerin görüntüsü ve iki sekmede oda/katılma/konuk dalması kontrol edildi. Parkurların tamamı elle bitirilmedi; farklı internet ağları arasında bağlantı testi yapılmadı.


## V9: özgün sesler, geniş yollar ve yeni engeller

- Zıplamada birinci, Shift kayma/dalmada ikinci kullanıcı ses kaydı çalar. Üçüncü kayıt yarışın başlangıcında ve yalnızca ilk katılımcının varışında birer kez çalar. Sonraki varışlar aynı sesi tekrarlamaz. Ses düğmesi tüm efektleri susturur.
- Üç rotanın genişliği %25 artırıldı; başlangıç, tahterevalliler, su kaydırağı ve bitiş geometrileri buna uyarlandı.
- Orta: ters yönlere dönen üç Denge Diski; boşluklardan zıplama, dönen yüzeyde dengede kalma ve yumuşak direklerden kaçınma.
- Zor: üç Ritim Kapısı; fiziksel paneller sırayla yana kayar. Her zaman yan geçiş alanı bırakılır.
- 57 otomatik test ve üretim derlemesi başarılı. Yeni diskler arası normal zıplama, üzerinde tutunma, kapı çarpışmaları/yan geçişleri, ses olayları ve geniş başlangıç çarpıştırıcıları doğrulandı. Tarayıcıda üç MP3 çözümleme/çalma ve iki yeni bölüm görsel olarak kontrol edildi. Tüm parkurların elle bitirilmesi ve farklı internet ağları bu sürümde test edilmedi.
