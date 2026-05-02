# Ghidul Complet: Crearea Serverului Gratuit pe AWS (EC2 t3.micro)

Pentru a ne găzdui tot monorepo-ul complet gratuit pe AWS, vom închiria o "mașină virtuală" cu Linux, denumită **EC2**. Amazon oferă acest server gratuit timp de 12 luni, cu condiția să folosești tipul `t2.micro` sau `t3.micro`.

> [!IMPORTANT]
> **Atenție la Costuri:** Atâta timp cât bifezi exact setările de mai jos (opțiunile marcate cu "Free tier eligible"), **nu vei plăti absolut nimic**.

Iată pașii exacți, click cu click:

### Partea 1: Deschiderea Serviciului EC2
1. Loghează-te în contul tău AWS creat anterior.
2. În bara de căutare principală (sus de tot), scrie **EC2** și dă click pe prima opțiune (Virtual Servers in the Cloud).
3. În panoul portocaliu, dă click pe butonul **Launch instance**.

### Partea 2: Configurarea Serverului
Acum ești pe ecranul de lansare al serverului. Completează formularul astfel:

1. **Name and tags**
   - Scrie: `portofoliu-personal-server`
2. **Application and OS Images (Amazon Machine Image)**
   - Dă click pe logoul **Ubuntu**.
   - Asigură-te că în dropdown scrie: `Ubuntu Server 24.04 LTS (HVM)` și dedesubt are o etichetă albastră pe care scrie **Free tier eligible**.
3. **Instance type**
   - Deschide meniul și alege `t3.micro` (sau `t2.micro` în funcție de regiunea ta). Trebuie să aibă eticheta **Free tier eligible**. Aceasta îți dă 2 procesoare virtuale și 1GB RAM.
4. **Key pair (login) — CEL MAI IMPORTANT PAS**
   - Aici se generează cheia de acces, fără de care nici noi, nici GitHub nu ne vom putea conecta vreodată la server. Nu există parole, doar această "cheie fizică".
   - Apasă pe **Create new key pair**.
   - **Key pair name**: `portofoliu-aws-key`
   - **Key pair type**: `RSA`
   - **Private key file format**: alege `.pem` (pentru Mac/Linux) sau `.ppk` (dacă folosești exclusiv PuTTY pe Windows). *Recomand `.pem` pentru că e cel mai simplu de integrat cu GitHub Actions și Windows Terminal.*
   - Apasă **Create key pair**. Un fișier (`portofoliu-aws-key.pem`) se va descărca pe calculatorul tău. **GRIJĂ MARE DE EL, NU ÎL PIERDE!**
5. **Network settings**
   - Dă click pe butonul `Edit` din secțiunea Network.
   - La secțiunea **Firewall (security groups)**:
     - Bifează **Create security group**.
     - Security group name: `portofoliu-web-sg` (sau ce nume dorești tu, de exemplu `otniel-iacob-web-sg`).
     - Description: Poți lăsa ce este completat automat sau să scrii "Web Security Group".
   - Mai jos, la **Inbound Security Group Rules**, trebuie să te asiguri că ai **3 reguli**. Folosește butonul **Add security group rule** pentru a le adăuga pe cele lipsă:
     - **Regula 1 (Deja existentă, pentru consolă):** Type `ssh`, Port range `22`, Source type `Anywhere` (0.0.0.0/0).
     - **Regula 2 (Să meargă site-ul pe HTTP):** Type `HTTP`, Port range `80`, Source type `Anywhere` (0.0.0.0/0).
     - **Regula 3 (Pentru SSL/Securitate pe viitor):** Type `HTTPS`, Port range `443`, Source type `Anywhere` (0.0.0.0/0).
6. **Configure storage**
   - Pune `30` GiB (limita maximă gratuită). Alege `gp3` ca tip.

### Partea 3: Lansarea
- În dreapta ecranului apasă butonul portocaliu **Launch instance**.
- Așteaptă câteva secunde până apare mesajul verde de succes.
- Dă click pe butonul **View all instances** din dreapta jos.
- Vei vedea serverul tău în listă având starea **Pending**, care se va schimba curând în **Running**.

### Ce trebuie să îmi transmiți mie?
Pentru a configura pipeline-ul nostru DevOps și pentru a pune codul acolo, am nevoie doar să:
1. Pui acel fișier `.pem` undeva la loc sigur.
2. Să îmi spui **Public IPv4 address** al serverului. (Îl găsești dând click pe numele serverului în listă; e un număr de tipul `18.234.xx.xx`).

Fără să îmi dai parola de la card sau contul Amazon, acest IP public, combinat cu cheia ta privată `.pem` (pe care o vom pune securizat direct pe GitHub mai târziu), ne sunt suficiente să orchestrăm totul "The Linux Way"!
