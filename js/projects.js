/* Conteúdo dos projetos — edite aqui para atualizar o site.
   Cada projeto gera automaticamente sua página em projeto.html?p=<slug>.
   Campos opcionais: place (localização), year (ano), area, status.
   Galeria: basta listar as fotos na ordem desejada — o layout segue
   automaticamente o ritmo 1 foto grande (16:9) + 2 fotos iguais.
   Use layout: "tall" para uma foto vertical isolada e centralizada. */
window.PROJECTS = [
  {
    slug: "casa-maya",
    title: "Casa Maya",
    location: "Riviera de São Lourenço, SP",
    place: "Riviera de São Lourenço, SP",
    category: "Residencial",
    status: "À venda",
    tags: ["Arquitetura", "Interiores", "Paisagismo"],
    cover: "img/maya-piscina.webp",
    hover: "img/maya-fachada.webp",
    heroPos: "50% 62%",
    lead: "Uma casa projetada com olhar de quem vai morar — olhar de dono.",
    text: [
      "Criada para ser palco de encontros, de conversas demoradas, de um drink no final do dia. Um lugar onde o cotidiano vira ritual, transformando cada momento em algo especial.",
      "Tramas, texturas e materiais naturais acolhem: a madeira do pergolado e do deck, as paredes de pedra, as fibras e a vegetação tropical que atravessa os ambientes. Na fachada, os cobogós deixam a luz vazar, criando movimento e sombras ao longo do dia.",
      "Um espaço que desperta sensações, que convida a sentir, tocar, respirar. Para quem for viver nela, a Casa Maya é experiência — não apenas arquitetura."
    ],
    credits: [
      ["Projeto", "Tey Romeiro Arquitetura"]
    ],
    gallery: [
      { src: "img/maya-fachada.webp", alt: "Fachada com cobogós, painéis de madeira e jardineira no pavimento superior" },
      { src: "img/maya-fachada-2.webp", alt: "Fachada vista da rua, com palmeiras e caminho de pisantes" },
      { src: "img/maya-jardim-rede.webp", alt: "Jardim lateral com rede entre as palmeiras e luminárias de fibra" },
      { src: "img/maya-fundos.jpg", alt: "Vista dos fundos da casa com a piscina, o pergolado e o jardim tropical" },
      { src: "img/maya-piscina-deck.webp", alt: "Deck de madeira com espreguiçadeiras junto à piscina" },
      { src: "img/maya-pergolado.webp", alt: "Mesa de jantar externa sob o pergolado coberto por trepadeiras" },
      { src: "img/maya-piscina.webp", alt: "Piscina e pergolado de madeira com a sala integrada ao fundo" },
      { src: "img/maya-vista-porta.webp", alt: "Vista da área da piscina emoldurada pela porta de correr" },
      { src: "img/maya-piscina-interna.webp", alt: "Piscina vista a partir da área coberta, com palmeira-laca ao fundo" },
      { src: "img/maya-jantar.jpg", alt: "Sala de jantar com luminária de fibra natural e jardins nas laterais" },
      { src: "img/maya-estar.webp", alt: "Estar com sofá terracota, parede de pedra e aparador em mármore verde" },
      { src: "img/maya-estar-escada.jpg", alt: "Estar junto à escada, com cobogós e jardim interno" },
      { src: "img/maya-cozinha.jpg", alt: "Cozinha em madeira clara com bancada curva e mármore verde" }
    ]
  },
  {
    slug: "casa-angra",
    title: "Casa na Ilha",
    location: "Angra dos Reis, RJ",
    place: "Angra dos Reis, RJ",
    category: "Residencial",
    tags: ["Arquitetura", "Interiores", "Paisagem"],
    cover: "img/angra-deck.jpg",
    hover: "img/angra-frontal.jpg",
    heroPos: "50% 60%",
    lead: "Um projeto que nasce do encontro entre arquitetura, natureza e mar.",
    text: [
      "Depois da casa do caseiro, a casa principal foi pensada para a mesma família — valorizando a paisagem, a leveza dos materiais e a experiência de viver um lugar tão especial.",
      "A casa se acomoda à encosta em patamares. Na base, um volume terroso abriga as áreas de convívio abertas para o gramado e para o deck sobre o mar; acima, os terraços ajardinados e as venezianas de madeira filtram a luz e a brisa, enquanto o telhado de telha cerâmica sobre estrutura aparente de madeira faz a ponte com a arquitetura tradicional da região.",
      "Cada vista, cada abertura e cada ambiente foram pensados para integrar a casa à ilha de forma natural e acolhedora."
    ],
    credits: [
      ["Projeto", "Tey Romeiro Arquitetura"],
      ["Equipe", "@brunosouza.sp_ · @arquitetamariaeduardaw · @mttpires.au"]
    ],
    gallery: [
      { src: "img/angra-frontal.jpg", alt: "Vista frontal da casa a partir do mar, com o deck de madeira em primeiro plano" },
      { src: "img/angra-lateral.jpg", alt: "Casa em patamares sobre a encosta, com a base em tom terroso" },
      { src: "img/angra-varanda.jpg", alt: "Varanda com guarda-corpo de madeira e jardineiras de costela-de-adão" },
      { src: "img/angra-deck-alto.jpg", alt: "Vista elevada da casa, do deck e do muro de pedra junto ao mar" },
      { src: "img/angra-deck.jpg", alt: "Deck de madeira sobre o mar com a casa ao fundo" }
    ]
  },
  {
    slug: "casa-do-caseiro",
    title: "Casa do Caseiro",
    location: "Angra dos Reis, RJ",
    place: "Angra dos Reis, RJ",
    category: "Residencial",
    tags: ["Arquitetura", "Interiores", "Paisagem"],
    cover: "img/caseiro-frente.webp",
    hover: "img/caseiro-aerea.webp",
    heroPos: "50% 55%",
    lead: "Uma casa simples em sua essência, mas generosa em cada escolha.",
    text: [
      "Uma história bonita que tivemos o privilégio de participar. Esta não é apenas uma casa de caseiro: é cuidado, respeito e valorização de quem vai morar ali. Em uma ilha de Angra dos Reis, ela foi pensada para uma família muito especial, que quis oferecer a essas pessoas aquilo que elas merecem — qualidade de vida, conforto e uma morada acolhedora.",
      "Implantada em um dos pontos mais altos do terreno, a casa tem o mar como cenário e a natureza como parte da experiência de morar. A varanda suspensa em deck de madeira, o telhado de telha cerâmica sobre estrutura roliça, as paredes em tom de terra e as janelas com venezianas coloridas fazem a ponte com a arquitetura tradicional da região.",
      "Embora tenha sido concebida para ser a casa do caseiro, acabou se tornando uma verdadeira casa dos sonhos: um lugar para acordar com o mar, viver em contato com a natureza e sentir que existe beleza também nas coisas simples.",
      "A arquitetura é também isso — entender que cada pessoa merece uma casa que acolha, respeite e proporcione uma vida melhor."
    ],
    credits: [
      ["Projeto", "Tey Romeiro Arquitetura"],
      ["Conjunto", "Projeto da mesma família da Casa na Ilha"]
    ],
    gallery: [
      { src: "img/caseiro-aerea.webp", alt: "Vista aérea do terreno com a casa do caseiro no alto e a casa principal junto ao mar" },
      { src: "img/caseiro-estar.webp", alt: "Estar e jantar com teto de madeira, luminárias de fibra e vista para o mar" },
      { src: "img/caseiro-varanda.webp", alt: "Varanda em deck de madeira com pergolado e vista para o mar" },
      { src: "img/caseiro-frente.webp", alt: "Fachada da casa com venezianas azuis e varanda suspensa sobre o jardim" },
      { src: "img/caseiro-lateral.webp", alt: "Vista lateral da casa com a escada de madeira de acesso à varanda" },
      { src: "img/caseiro-jardim.webp", alt: "A casa entre palmeiras e o jardim de forrações e gramíneas" }
    ]
  },
  {
    slug: "tera-hub",
    title: "Edifício Tera Hub",
    location: "Edifício corporativo",
    category: "Corporativo",
    tags: ["Edificação", "Interiores", "Arquitetura biofílica"],
    cover: "img/terahub-lateral.jpg",
    hover: "img/terahub-atrio.webp",
    heroPos: "50% 42%",
    lead: "O futuro dos edifícios corporativos não será definido pela tecnologia que eles abrigam, mas pela forma como fazem as pessoas se sentirem.",
    text: [
      "Durante muito tempo, os edifícios corporativos foram pensados para atender às necessidades das empresas. Neste projeto, decidimos inverter essa lógica. A tecnologia continua sendo protagonista, mas trabalha em silêncio — o verdadeiro centro do projeto são as pessoas.",
      "Projetamos um edifício para uma empresa de tecnologia que acredita que a inovação não nasce apenas de equipamentos de última geração ou de inteligência artificial. Ela nasce da criatividade, da troca de ideias, do bem-estar e da qualidade de vida de quem faz a empresa acontecer todos os dias. Cada decisão arquitetônica foi guiada por uma pergunta simples: como criar espaços que promovam bem-estar desde o momento da chegada?",
      "A resposta está em cada ambiente: a recepção em concreto e madeira que se abre para o átrio arborizado, o térreo integrado à praça, as áreas de convivência, o mezanino, o auditório e as salas de trabalho envoltas em luz natural. Ventilação natural, arquitetura biofílica e espaços colaborativos fazem parte de uma proposta que valoriza o bem-estar como elemento essencial da inovação.",
      "A tecnologia conecta sistemas. A arquitetura conecta pessoas."
    ],
    credits: [
      ["Projeto", "Tey Romeiro Arquitetura"],
      ["Equipe", "@brunosouza.sp_ · @arquitetamariaeduardaw"]
    ],
    gallery: [
      { src: "img/terahub-frente.jpg", layout: "pair", alt: "Fachada frontal com brises verticais de madeira e jardineiras em todos os pavimentos" },
      { src: "img/terahub-lateral.jpg", layout: "pair", alt: "Vista em perspectiva do edifício a partir da rua arborizada" },
      { src: "img/terahub-posterior.jpg", layout: "tall", alt: "Fachada posterior com terraços ajardinados e caixilharia em vidro" },
      { src: "img/terahub-praca.webp", alt: "Térreo envidraçado aberto para a praça com piso de paralelepípedos e jardins" },
      { src: "img/terahub-recepcao.jpg", alt: "Recepção em concreto aparente com bancos e balcão de madeira" },
      { src: "img/terahub-atrio.webp", alt: "Átrio com árvore central, mesa coletiva e áreas de estar" },
      { src: "img/terahub-atrio-2.webp", alt: "Átrio de pé-direito duplo com a árvore atravessando o mezanino" },
      { src: "img/terahub-convivencia.webp", alt: "Área de convivência do térreo aberta para o deck externo" },
      { src: "img/terahub-lounge.webp", alt: "Lounge com poltronas terracota, café e salas de reunião em OSB" },
      { src: "img/terahub-mezanino.webp", alt: "Mezanino com estar, copa e vista para a copa da árvore" },
      { src: "img/terahub-auditorio.webp", alt: "Auditório com forro ondulado de madeira e cadeiras verdes" },
      { src: "img/terahub-cafe.jpg", alt: "Espaço de café e convivência com iluminação em trilhos" },
      { src: "img/terahub-diretoria.webp", alt: "Estar da diretoria com salas envidraçadas e estantes em madeira iluminadas" }
    ]
  },
  {
    slug: "casa-real-park",
    title: "Casa Real Park",
    location: "Retrofit residencial",
    category: "Retrofit",
    tags: ["Retrofit", "Fachada", "Área de lazer"],
    cover: "img/realpark-lazer.jpg",
    hover: "img/realpark-tey.jpg",
    heroPos: "50% 55%",
    lead: "Honrar uma arquitetura singular e trazê-la para a atualidade com leveza.",
    text: [
      "Era uma construção cheia de personalidade: vigas curvas, paredes arredondadas, tijolinhos de vidro — tudo envolto por um branco que deixava transparecer a alma contemporânea do projeto. A primeira intenção foi honrar essa arquitetura, seus volumes e suas curvas, com clareza volumétrica.",
      "Na fachada, o branco foi preservado e aquecido por um revestimento amadeirado, que trouxe acolhimento e equilíbrio. Na área de lazer, a transformação foi completa: o espaço foi reconfigurado para uma família que valoriza estar reunida, praticar exercícios, conectar-se com a natureza e manter um estilo de vida saudável.",
      "As ideias foram apresentadas já na primeira visita — e, a partir dali, arquiteta e cliente seguiram juntas, dando uma nova vida à casa."
    ],
    credits: [
      ["Projeto", "Tey Romeiro Arquitetura"],
      ["Escopo", "Retrofit de fachada e área de lazer"]
    ],
    gallery: [
      { src: "img/realpark-tey.jpg", alt: "Pavilhão de academia envidraçado junto à piscina, cercado por vegetação tropical" },
      { src: "img/realpark-fachada.jpg", alt: "Fachada com revestimento amadeirado e escada de acesso entre palmeiras" },
      { src: "img/realpark-piscina.jpg", alt: "Piscina revestida em pastilhas verdes com deck e pergolado" },
      { src: "img/realpark-academia.jpg", alt: "Interior da academia com forro de madeira e iluminação linear" },
      { src: "img/realpark-sauna.jpg", alt: "Acesso à sauna iluminado entre o jardim de seixos" },
      { src: "img/realpark-lazer.jpg", alt: "Varanda com poltronas de fibra natural e maciço de helicônias" }
    ]
  },
  {
    slug: "vila-real-park",
    title: "Vila Real Park",
    location: "Conjunto residencial",
    category: "Residencial",
    tags: ["Arquitetura", "Paisagismo integrado"],
    cover: "img/vila-rua.jpg",
    hover: "img/vila-aerea.jpg",
    heroPos: "50% 70%",
    lead: "Mais do que projetar residências, o desafio foi criar um lugar de convivência.",
    text: [
      "Desenvolvido para uma mesma família, o projeto nasceu do desejo de manter a proximidade entre os seus membros sem abrir mão da individualidade de cada residência.",
      "Arquitetura e paisagismo foram concebidos em conjunto para construir uma experiência integrada, onde os limites se tornam mais sutis e a natureza assume o papel de conexão entre os espaços.",
      "Sem barreiras visuais marcantes, os jardins se entrelaçam, os percursos se conectam e a paisagem cria unidade entre as diferentes construções — promovendo privacidade, convivência e bem-estar."
    ],
    credits: [
      ["Arquitetura", "Tey Romeiro Arquitetura"],
      ["Paisagismo", "@matheusaroge"],
      ["Equipe", "@brunosouza.sp_ · @arquitetamariaeduardaw · @gabijamacaru"]
    ],
    gallery: [
      { src: "img/vila-aerea.jpg", alt: "Vista aérea do conjunto de residências com jardins integrados e piscina" },
      { src: "img/vila-encosta.jpg", alt: "As residências acompanhando a curva da rua e a topografia" },
      { src: "img/vila-aerea-2.jpg", alt: "Vista aérea das entradas das residências e dos acessos ajardinados" },
      { src: "img/vila-rua.jpg", alt: "Fachadas voltadas para a rua com escadarias e canteiros floridos" }
    ]
  }
];
