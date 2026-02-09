#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Actualiza auth_index.json con todos los estudiantes
"""

import json
import os
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Lista 1: Estudiantes SG con correos personales
lista1 = """1122928226	ANTHONY ESNEIDER BAUTISTA BERNAL	SG	anthu375x2@gmail.com
1095806347	ANA MARÍA LIZARAZO RINCÓN	SG	ana.lizarazo76@gmail.com
1105374916	VALENTINA VANEGAS GARCIA	SG	valentinavanegasg09@gmail.com
1029653948	SARA NIKOL ORTEGA FRANCO	SG	fatheart.lvs.t@gmail.com
1157963701	AVIMELEC PARRA CORREA	SG	abimelecmeche10@gmail.com
1085917551	SAMUEL NICOLAS BENAVIDES LOPEZ	SG	samuelnicolas0207@gmail.com
1111543838	JUAN SEBASTIAN CARLOSAMA VALLEJO	SG	sebastianvallejogenially@gmail.com
1091977784	BRYAN ALEXANDER PEDRAZA GONZALEZ	SG	bryanysofipedraza@gmail.com
1110041815	MARIANA SOFÍA GOMEZ BECERRA	SG	marianasofia31122006@gmail.com
1110297721	EMILY MARCELA VARGAS ORDÓÑEZ	SG	emily.marcela.vargas@gmail.com
1117513981	BRIYITH DAYANA OSORIO MOLINA	SG	do1371521@gmail.com
1063961186	SANTIAGO CARRASQUILLA SUAZA	SG	carrasantiago20@gmail.com
1075796108	KEVIN SANTIAGO RINCON GIL	SG	estudiorinconkevin@gmail.com
1107856323	SARA DANIELA GALLARDO BELTRÁN	SG	saradanielagallardobel@gmail.com
1080054769	DANIEL ALEJANDRO SOLARTE RIASCOS	SG	alejandrosolarte2509@gmail.com
1047442757	SANTIAGO DE JESUS GUTIÉRREZ MONSALVE	SG	sssantx0@gmail.com
1077228978	JUAN ESTEBAN HOME PAJOY	SG	juanhome091215@gmail.com
1100958315	EMILY STHEFANY RONDON CONTRERAS	SG	emilyrondonc2024@gmail.com
1066875471	MARIA DANIELA ESQUEA ACEVEDO	SG	danielaesquea816@gmail.com
1085173122	JOSÉ JULIÁN ZAMBRANO FUENTES	SG	josejulianzambranofuentea@gmail.com
1065891331	MARÍA MILAGROS PAVA ARIAS	SG	milaagritous@gmail.com
1067815086	DANIELA STEFANIA MEJIA MARTINEZ	SG	danielamejimar@gmail.com
1109118764	SARA VICTORIA CRUZ PROAÑOS	SG	sarita0203040506@gmail.com
1049024150	LUNA VALENTINA MORALES IDARRAGA	SG	lunavmorales@gmail.com
1058548381	JHON ALEXANDER ARANDA SANTACRUZ	SG	arandasantacruzjhonalexander@gmail.com
1032184613	EMILY OTERO BORJA	SG	emilyotero2010@gmail.com
1146634145	MIRIAN TENORIO ROJAS	SG	mtenorio.rs@gmail.com
1155214072	SARA YULIETH ASPRILLA CAÑIZALES	SG	saraacanizales26@gmail.com
1092460409	MARIANA CEBALLOS GARZÓN	SG	isacardonabex@gmail.com
1130268095	FABIAN DE JESUS MIRANDA VARELO	SG	fabi302806@gmail.com
1097499747	JOHAN ALEXANDER PEÑALOZA PARRADO	SG	johaanalexanderparra@gmail.com
1044639981	DIOSA MARIA GUERRERO CABARCAS	SG	diosaguerrero1908@gmail.com
1058548781	JUAN MANUEL MUÑOZ NAVIA	SG	juanmanuelmunos95@gmail.com
1169713398	CHRISTIAN DAVID ARRIETA HERNÁNDEZ	SG	christianarrieta19@gmail.com
1029800219	JULIANA ANDREA RUDAS HUERTAS	SG	julianarudas6@gmail.com
1066573090	LUIS FERNANDO PETRO TREJO	SG	luisfernandopetrotrejo@gmail.com
1138274816	JUAN CAMILO JARAMILLO MONTENEGRO	SG	ghjuanjuanca@gmail.com
1126452201	ISABELLA LOPEZ CARDONA	SG	isalopezcardona09@gmail.com
1102635521	YURY ANDREA CASTELLANOS GAST	SG	andreitacast.xx@gmail.com
1101261609	JULIO CESAR MEJIA ARCINIEGAS	SG	juliocesrmejia202@gmail.com
1077231248	SARAH ISABELLA HOYOS HERNANDEZ	SG	hoyoshernandezsaraisabella@gmail.com
1104945170	NICOLAS ANDRES LOAIZA LEIVA	SG	nianlole11@gmail.com
1120574144	BREYMAN ALEXÁNDER ARIZA RODRÍGUEZ	SG	breymanarizarodriguez@gmail.com
1075541298	KAROL DAYANA RUBIANO DELGADO	SG	kroolrubiano3011@gmail.com
1044219028	ALEJANDRA SOPHIA CASTILLA PINZÓN	SG	alejandracaspin@gmail.com
1052391404	MANUELA ALEJANDRA LÓPEZ AGUILAR	SG	manux.5516@gmail.com
1004577058	RICHARD ARMANDO JIMÉNEZ CORAL	SG	armandojc2003@gmail.com
1040739119	ANA SOFIA MUÑOZ CASTAÑO	SG	sofiaestrellasapa@gmail.com
1081762386	SHEYLA MEDINA GARCIA	SG	sheylamedinagarcia13@gmail.com
1082924085	ANGELY JULISSA ANAYA ORTIZ	SG	angelyanayap@gmail.com
1095807668	VALERIA RUBIO INFANTE	SG	rubioinfantevaleria@gmail.com
1121418643	DANNA CAMILA ALVAREZ CAMACHO	SG	grado5adannacamilaalvarez@gmail.com
1002367670	CRISTIAN CAMILO TORRES BELTRAN	SG	cristian.torres09@uptc.edu.co
1075793667	MARÍA DE LOS ÁNGELES MALDONADO GONZÁLEZ	SG	maria.dangelesgg@gmail.com
1149934544	ANDRES FELIPE HERNANDEZ ARIAS	SG	andres20081022@gmail.com
1066870583	CAROLINA DANIELA MAESTRE SALAS	SG	carolinadanie07@gmail.com
1095310342	GONZALO ANDRÉS PRADA OTERO	SG	gonzaloandresprada@gmail.com
1110484282	CAROLINA BONILLA BETANCOURTH	SG	basquezeliana@gmail.com
1069489668	MARTIN ELIAS CALDERA CORONADO	SG	mariaeugeniacoronandoozuna@gmail.com
1104936736	CAMILO MORALES AYALA	SG	moralescapi2005@gmail.com
1110293421	JUAN DAVID LOPEZ SANCLEMENTE	SG	juandlopezsan@gmail.com
1096207726	NASLY DELGADO RAMÍREZ	SG	naslydelgado27@gmail.com
1044639043	LAURA VALENTINA DÍAZ BARRIOS	SG	lauravalentinadiazbarrios09@gmail.com
1103862082	MARIA JOSE TOVAR OLIVERA	SG	majotovar21@gmail.com
1047431937	ZARETH SOFIA TUIRAN POLO	SG	zarethtuiran@gmail.com
1094052589	DANNA VALERIA HERNANDEZ AYALA	SG	valeriaaahern@gmail.com
1067608145	MARIAN ABBY VERGEL GONZALEZ	SG	marianabbyvergel@gmail.com
1044920668	FERNEY JUNIOR GUTIERREZ SIMANCAS	SG	gutierrezferney79@gmail.com
1076907474	JESUS DAVID CEBALLOS RODRIGUEZ	SG	davidceballosro@gmail.com
1086774484	PAULA ANDREA PEDROZA JACOME	SG	paupjacome14@gmail.com
1076245818	JUANA MARÍA JIMÉNEZ TOVAR	SG	jimenezjuanita.210@gmail.com
1138274857	DORIAN SAMUEL PUENTES PLAZAS	SG	samuelpuentesp.318@gmail.com
1042858004	MARIANA JUDITH GARCÍA GUZMÁN	SG	marianajudithgarcia.idetp@gmail.com
1104871573	ANA SOFIA ROMANA IRIARTE	SG	sofiaromanairiarte@gmail.com
1043979205	VALENTINA OCAMPO SERPA	SG	valentinaocampo884@gmail.com
1076906829	JHAN POOL CRUZ RIVAS	SG	jhanpoolcruzrivas@gmail.com
1042260050	MATEO ALEJANDRO HERRERA VALLEJA	SG	mateoherrerav709@gmail.com
1041634016	ISSI REL JACH BARRIENTOS	SG	jaissirbarrientos@gmail.com
1104547587	JUAN DAVID LUGO TORRES	SG	juandavidlugotorres@gmail.com
1092533604	BRAYAN SNEIDER PELAEZ BARON	SG	brayanpelaez542@gmail.com
1058932026	LAURA ISABEL SARRIA CASTILLO	SG	laura06165@gmail.com
1065632863	NICOLAS DAVID GIRALDO SARMIENTO	SG	giraldosarmientonicodavid@gmail.com
1016835086	SAMARA NEVA MOYANO	SG	samaranevam@gmail.com
1067606378	ISABEL SOFIA ARAGÓN MEJÍA	SG	isaragonm2709@gmail.com
1065605787	MARCO JOSÉ ARIAS CABARCAS	SG	maxfrioarias@gmail.com
1067166704	JOSÉ JULIÁN GENES RUIZ	SG	josegenes1203@gmail.com
1194965164	ANDRÉS CAMILO CONTRERAS PÉREZ	SG	andrescontreras21027@gmail.com
1102636212	ANGIE SOFIA GRANADOS OCHOA	SG	ochoaangie1608@gmail.com
1102518311	JULIAN ALEJANDRO DIAZ MENDOZA	SG	julianalejandrodiazmendoza@gmail.com
1042857498	SANTIAGO GARCIA CASTILLO	SG	santiago.garcia.c2009@gmail.com
1101756438	JHON SEBASTIÁN CASTAÑEDA DUARTE	SG	jhonsebascastaduarte@gmail.com
1095307497	JULIAN DAVID SILVA DIAZ	SG	silvajulian731@gmail.com
1044637488	LUIS ALEJANDRO CHAVEZ GUERRERO	SG	s4291521@gmail.com
1085908598	YEFERSON LIBARDO CHAUCANES GONZALEZ	SG	jefergonza785@gmail.com
1081700288	DANIELA ALEXANDRA VALENCIA ÁVILA	SG	daniel4valenci4@gmail.com
1102637143	DANIEL ANDRÉS PINTO ANAYA	SG	niichi083@gmail.com
1059843088	DARWIN ALEXIS ROSERO ROSERO	SG	darwinrosero552@gmail.com
1105469880	SAMUEL ESTEBAN FIGUEROA HERNÁNDEZ	SG	grado5asamuelfigueroa@gmail.com
1142716693	ISABELLA VIVIESCAS ROMERO	SG	isabellaviviescas03@gmail.com
1112050286	VALENTINA RODRÍGUEZ BELTRAN	SG	valenrodribel@gmail.com
1069487805	GUBER AGUAS AGUAS CASTRO	SG	castroclarena881@gmail.com
1080055415	DANNY JEFERSON TANDIOY MALUA	SG	jhoanamalu2@gmail.com
1047453142	ANGELY VIANA VASQUEZ	SG	angelyviana2010@gmail.com
1006743818	YULIANIS MARIA MENDOZA BARBOSA	SG	menyulianis2002@gmail.com
1029883902	MAIRA SOFIA MARTINEZ AVILEZ	SG	maaviowo@gmail.com
1033103778	ISABELLA GELVES BERTELL	SG	gelvesisabella6@gmail.com
1073821473	ANDRÉS MAURICIO DURANGO HERNÁNDEZ	SG	andresdurango1309@gmail.com
1053334092	DAVID NICOLAS SALINAS FORERO	SG	salinasforeronicolas2000@gmail.com
1054870748	ALEJANDRO LOAIZA SARAVIA	SG	alejothemaster1@gmail.com
1050956923	DAIRO ALBERTO CARDENAS DÍAZ	SG	cardenasdiazd973@gmail.com
1106227901	LAURA ISABEL AUBILLUS GARCIA	SG	ubilluslauraisabela@gmail.com
1126140521	SAMUEL DAVID GOMEZ ARCOS	SG	sdga1107@gmail.com
1155213317	SOFIA RENDON CANTILLO	SG	rendon.cantillo@gmail.com
1093855665	GABRIELA SOFIA CORONEL HERNÁNDEZ	SG	gabrielacoronelhdez@gmail.com
94513460	ANDRÉS IGNACIO MONTEALEGRE ORDÓÑEZ	SG	andresmontealegreordonez@gmail.com
1029883931	SANDRA YULIETH PEDRAZA GARCIA	SG	sandrayuliethpedrazagarcia@gmail.com
1091204793	SOFIA DIAZ LINARES	SG	sofiaiaz112286@gmail.com
1069486724	SHEILYN LOPEZ RESTÁN	SG	lopezrestansheilyn@gmail.com
1005650933	LUIS FERNANDO HURTADO ARDILA	SG	luisfercho130@gmail.com
1105477490	SANTIAGO MOLINA BARRERA	SG	santiagomolina.barrera2@gmail.com
1104262349	MOISÉS LARA MERCADO	SG	moiseslaramercado536@gmail.com
1057981526	BRIHAM FELIPE VARGAS ROCHA	SG	brian240709@gmail.com
1065636331	SHEIRITH PAOLA BRITO MIRANDA	SG	sheirithbrito10@gmail.com
1059241809	MANUEL ALEJANDRO VIDAL ORDÓÑEZ	SG	manuelalejandrovidalordonez@gmail.com
1016716877	WILLIAM DAVID DURAN ARCE	SG	williamdavidduranarce3@gmail.com
1048071942	MELISSA PAOLA BERMEJO RAMOS	SG	melissabermejoramos0724@gmail.com
1024502309	CAROL YULIANA HERRERA DUARTE	SG	herreracarol08hd@gmail.com
1122521893	SANTIAGO MANCERA HERNÁNDEZ	SG	santiagomancerahernandez@gmail.com
1050955964	JUAN DE DIOS MARRUGO BARRIOS	SG	juanmarrugo2009@gmail.com
1013126644	JUAN CARLOS RODRÍGUEZ DUCUARA	SG	juancarro24@gmail.com
1138026766	JORGE LUIS PASTRANA BELTRAN	SG	jorgeluispasar6@gmail.com
1085915140	MICHELL DANIELA CIFUENTES NIÑO	SG	cifuenmichell@gmail.com
1069485760	FELIPE QUINTERO PATERNINA	SG	sulaypaternina@gmail.com
1032184918	HAYLIN FERNANDA PINO BUENAÑO	SG	haylinpino3@gmail.com
1079536118	ISABELLA LARRAZÁBAL CARDOSO	SG	isabella.larrazabal899@gmail.com
1043306345	ALEJANDRO LUENGAS VERGARA	SG	aluengasv@gmail.com
1027402319	DELIA SALOMÉ SEPÚLVEDA GONZÁLEZ	SG	desasego@gmail.com
1048072342	SARAH MICHELLE MARTINEZ REBOLLEDO	SG	sarahmareb@gmail.com
1106333364	MÓNICA ALEXANDRA GUZMÁN OSORIO	SG	moniguz290709@gmail.com
1043004497	DANIELA GARCÍA PACHECO	SG	dgarciaaap@gmail.com
1096702256	ISABEL SOFÍA SEPÚLVEDA BERNAL	SG	sotigure@gmail.com
1109548694	ANGEL DAVID ZAPATA VARGAS	SG	zzapxta07@gmail.com
1083892824	VALERIE ALEJANDRA PÉREZ ORTEGA	SG	valerieperez085@gmail.com
1144627582	ANYELA DAYANA PAJOY ANDRADE	SG	dayanaandrade1948@gmail.com
1140014252	SARHA KATALINA TORRES CALDERON	SG	sarhatorres978@gmail.com
1128149382	MIGUEL ANTONIO LEONES YEPES	SG	miguelleones124@gmail.com
1069486269	SANTIAGO JESÚS BONILLA SERPA	SG	santiagobonillaienal@gmail.com
1082803801	MARÍA ALEXANDRA CRISPÍN VARGAS	SG	crisvamalia@gmail.com
1029601434	MARIANA ISABELLA SANCHEZ CAICEDO	SG	marianacaice21@gmail.com
1069488246	MARÍA ANDREA PINTO MONSALVE	SG	mariaandreapinto75@gmail.com
1075798438	MARIANA QUESADA VARGAS	SG	marianaquesada1327@gmail.com
1019997557	MARÍA JOSÉ ROMERO PLATA	SG	mariajoseromeroplata@gmail.com
1048068794	ISMAEL HERNAN OSORIO CAICEDO	SG	osoriocaicedoismaelhernan@gmail.com
1126120666	FERNANDO ALFONSO ARAUJO SANCHEZ	SG	fernandoalfonsoas@gmail.com
1019997558	SARAH VALENTINA ROMERO PLATA	SG	sarahvalentinaromeroplata@gmail.com
1126459774	DANA KATIUSKA ANGELINA SOUSA TISOY	SG	valdana2613@gmail.com
1062438387	MARÍA CELESTE OLIVEROS HOYOS	SG	mariacelesteoliveroshoyos@gmail.com
1059236790	XIOMARA GIRONZA PINO	SG	marianabeer60@gmail.com
1105373328	MARIANA RENGIFO CUELLAR	SG	marirengifoc22@gmail.com
1052080022	ANDRES FELIPE PEREZ ARRIETA	SG	andrepe194@gmail.com
1013007571	ELIANA TAPASCO TREJOS	SG	d3982056@gmail.com
1096946039	MARISOL YULIANA SUÁREZ NIÑO	SG	mari.yulisn@gmail.com
1095309044	LUIS SEBASTIAN TORRES DELGADO	SG	delgado304030@gmail.com
52733720	LEIDY JOHANA ACOSTA VARGAS	SG	carolineacosta51@gmail.com
1042856201	KEREN YISELLE SALINAS MENA	SG	yisellemena3456@gmail.com
1104821350	VALENTINA PEÑARANDA AGUDELO	SG	valentinapenarandaagudelo@gmail.com
1127049684	MICHELL SANCHEZ DURAN	SG	michellfer611@gmail.com
1142919497	NAHOMI KAOTY RINCON NAVARRO	SG	rinconnavarronahomikaoty@gmail.com
1146534297	JUAN CAMILO PETRO MONTERROSA	SG	pcami747@gmail.com
1080692743	JENNIFER NATHALY GUERRERO GETIAL	SG	jennifergetial72@gmail.com
1029665464	SHARITH NIKOL BARREIRO RIAÑO	SG	sharith.nikol000@gmail.com
1089176665	KAROL VALENTINA VILLARREAL ROSERO	SG	villarrealrserok@gmail.com
1105393085	KAROL TATIANA NEGRETE MELENDREZ	SG	karolnegrete035@gmail.com
1097397092	MARIA VALENTINA VELA HERRERA	SG	valentinavela447@gmail.com
1095308056	JUAN JOSE QUINCHIA GÓMEZ	SG	juanquinchia26@gmail.com
1080053289	SOFIA RENGIFO ORDOÑEZ	SG	rengifosofia10@gmail.com
1085926779	DANIEL SEBASTIAN RIASCOS MORENO	SG	danielsebastianriascosmoreno@gmail.com
1112050309	ISABEL GAMBOA TROCHEZ	SG	gamboasanchezisabel@gmail.com
1061738331	SERGIO IVAN RIVERA QUISOBONI	SG	sirq534@gmail.com
1003951118	SARA HELENA MORRIS GARCIA	SG	sarahelenamorris@gmail.com
1059241156	DUVAN ESTEVAN BUITRON SAMBONI	SG	estebanbuitron051@gmail.com
1111481971	JOSÉ JOAQUÍN CARLOSAMA VALLEJO	SG	josecarlosama17v@gmail.com
1077857870	NICOL MARIANA CALDERÓN CEDIEL	SG	nikolmarianacediel@gmail.com
1087415219	ANGIE CAROLINA BRAVO CARATAR	SG	angiecarolinabravo@gmail.com
1068139247	LUNA CELESTE GARCÍA SALGADO	SG	lunag6724654@gmail.com
1033735235	TOMAS FELIPE VELASQUEZ CHAPARRO	SG	tomasvelasquez747@gmail.com
1058934104	EMMANUEL CASTRO ZUÑIGA	SG	emmanuelcastro201912@gmail.com
1019065701	SHARID JULIANA PEÑA MARTINEZ	SG	penaj23.11.09@gmail.com
1022982649	SARAY VALENTINA FONTALVO SANTIZ	SG	saryvalentina72@gmail.com
1080053433	NATHALIA SOFIA BASANTE BASANTE	SG	nathr33333@gmail.com
1089606880	MANUELA ISAZA MORALES	SG	misazamorales@gmail.com
1104379631	YULIANA SOFIA ARROYO CACERES	SG	yulianaarroyocaceres@gmail.com
1099207339	ESTEBAN CASTELLANOS GOMEZ	SG	yuliancas08@gmail.com
1069724418	EILEEN JOYCE PÉREZ ESPINOSA	SG	jxoyce.pe@gmail.com
1101688501	LUCIANA ANDREA RODRIGUEZ CASTELLANOS	SG	lucianandrea2408@gmail.com
1029400429	LILY TATIANA RODRÍGUEZ NONTOA	SG	tr254095@gmail.com
1088157493	DANNY FELIPE CAIPE ESPINOSA	SG	felipec1088@gmail.com
1093760224	SHARIK SAMIRA ALBARRACIN CHIA	SG	shariksamir012009@gmail.com
1123438444	JEYDI YERALDIN RIAÑO MARTINEZ	SG	yeraldinriano094@gmail.com
1043307707	VALERYS SALCEDO MUNOZ	SG	valeryssalcedomunoz5@gmail.com
1033105351	LAURA SOFIA BUITRAGO RAMOS	SG	laurita00sof@gmail.com
1089511979	JUAN MIGUEL GUERRERO TENORIO	SG	migueljuanguerrerot@gmail.com
1110366401	ALEJANDRO VASQUEZ MOLINA	SG	alejandro.vasquez.molina@correounivalle.edu.co
1097782189	JOAN SEBASTIAN SANCHEZ CARRILLO	SG	danksta043@gmail.com
1104942721	EILEEN DAYANA RODRIGUEZ RODRIGUEZ	SG	eileen.rdv@gmail.com
1080693742	FANYER SANTIAGO FIGUEROA CUAICAL	SG	fanyersantiagofigueroacuaical@iemciudaddepasto.edu.co
5986576	VICTOR MANUEL GARAVITO GONZÁLEZ	SG	gonzalesbiktor@gmail.com
1109548599	MARIA DE LOS ANGELES GÓMEZ CEBALLOS	SG	angelesgomez2831@gmail.com
1085927353	FRANCK RAFAEL CHACUA BURGOS 	SG	rafaburgos393@gmail.com
1041695802	ANNA MARÍA RUEDA NARVÁEZ	SG	annaruvx@gmail.com"""

# Lista 2: Estudiantes IETAC y SG adicionales con correos institucionales
lista2 = """1066605450	IETAC - MARÍA ESTHER ACOSTA FERIA	IETAC	acostaferiame.sg.est@gmail.com
1063789927	IETAC - JHOANS SEBASTIÁN DURANGO ZABALA	IETAC	durangozabalajs.sg.est@gmail.com
1133790795	IETAC - ELICEO ELI FUENTES DÍAZ	IETAC	fuentesdiazee.sg.est@gmail.com
1148438187	IETAC - HAROLD IVÁN HOYOS VERGARA	IETAC	hoyosvergarahi.sg.est@gmail.com
1063296017	IETAC - ISABELLA MANCHEGO LOZANO	IETAC	manchegolozanoi.sg.est@gmail.com
1070815365	IETAC - MARÍA ANGÉLICA MORELO VILLEROS	IETAC	morelovillerosma.sg.est@gmail.com
1038117449	IETAC - ADRIANA LUCÍA ROJAS CORDERO	IETAC	rojascorderoal.sg.est@gmail.com
1063290456	IETAC - ARNEDIS SIBAJA BEGAMBRE	IETAC	sibajabegambrea.sg.est@gmail.com
1067898547	IETAC - ALEXANDRA URZOLA MARTÍNEZ	IETAC	urzolamartineza.sg.est@gmail.com
1066605887	IETAC - DANIEL ANDRÉS ZABALA MONTIEL	IETAC	zabalamontielda.sg.est@gmail.com
1066606169	IETAC - LUIS MARIO ZABALA SÁNCHEZ	IETAC	zabalasanchezlm.sg.est@gmail.com
1063363727	IETAC - RONALDO ANDRÉS ZULETA GUERRA	IETAC	zuletaguerrara.sg.est@gmail.com
1133790838	IETAC - LUIS DANIEL MENDOZA URIBE	IETAC	mendozauribeld.sg.est@gmail.com
1148695425	IETAC - ALEXANDRA JULIO ROMERO	IETAC	julioromeroa.sg.est@gmail.com
1066573694	IETAC - VIVIANA MARCELA ROMERO ZÚÑIGA	IETAC	romerozunigavm.sg.est@gmail.com
1067286561	IETAC - DAVIER ESTEBAN OTERO URANGO	IETAC	oterorurangode.sg.est@gmail.com
1148437900	IETAC - LUISA FERNANDA BARÓN LUCAS	IETAC	baronlucaslf.sg.est@gmail.com
1148695420	IETAC - JORGE ANDRÉS PÉREZ MESTRA	IETAC	perezmestreja.sg.est@gmail.com
1148695628	IETAC - DAYANA MICHEL PEÑA TORDECILLA	IETAC	penatordecilladm.sg.est@gmail.com
1148695483	IETAC - EILIN JARAMILLO CASTILLO	IETAC	jaramillocastilloe.sg.est@gmail.com
1080052959	SG - KAROL VALENTINA CEBALLOS QUIROZ	SG	ceballosquirozkv.sg.est@gmail.com
1022367201	SG - SANTIAGO SERNA MEDINA	SG	sernamedinas.sg.est@gmail.com
7734824	SG - BRITANI MARIANGEL AGUERO GARCIA	SG	aguerogarciabm.sg.est@gmail.com
1112465416	SG - LUIS FERNANDO LOPEZ LOPEZ	SG	lopezlopezlf.sg.est@gmail.com
1102826203	SG - JUAN JOSE CASTILLO VIVERO	SG	castillviverojj.sg.est@gmail.com
1011092218	SG - LORENA ALEJANDRA POVEDA QUIÑONES	SG	povedaquinonesla.sg.est@gmail.com
1045671402	SG - USUARIO PRUEBA TEST	SG	usuarioprueba.sg.est@gmail.com
1003568958	SG - MARIANA PARRA ÁNGEL	SG	parraangelm.sg.est@gmail.com
1081279021	SG - PAULA ISABEL JOJOA BUCHELI	SG	jojoabuchelipi.sg.est@gmail.com
1121539027	SG - SANTIAGO MÁRQUEZ MARTÍNEZ	SG	marquezmartinezs.sg.est@gmail.com
1124021237	SG - ALBERT RICARDO HINESTROZA FLOREZ	SG	hinestrozaflorezsag.sg.est@gmail.com
1121539427	SG - NAILIN ANDREA VALLE RUIZ	SG	valleruizna.sg.est@gmail.com
1175714000	SG - LINDA ROSA CÓRDOBA CRUZ	SG	cordobacruzlr.sg.est@gmail.com
1150434301	SG - ERICK SANTIAGO ABRIL FUQUEN	SG	abrilfuquenes.sg.est@gmail.com
1038118033	SG - MATIAS CARDENAS LOZANO	SG	cardenaslozanom.sg.est@gmail.com
1059234430	SG - SANTIAGO GUEVARA VELASCO	SG	guevaravelascos.sg.est@gmail.com
1104822690	SG - ISABELLA GONZÁLEZ LEAL	SG	gonzalezleali.sg.est@gmail.com
1109669274	SG - ISABEL SOFÍA CASTAÑO MONTOYA	SG	castanomontoyais.sg.est@gmail.com
1086132449	SG - VALERIA FERNANDA GUERRERO CHATES	SG	guerrerochatesvf.sg.est@gmail.com
1043164246	SG - JAIDER SANTIAGO BLANCO VIVANCO	SG	blancovivancojs.sg.est@gmail.com
1043164248	SG - JAIDER MANUEL BLANCO VIVANCO	SG	blancovivancom.sg.est@gmail.com
1083753177	SG - MIGUEL ANGEL CHACHINOY CRIOLLO	SG	chachinoycrilloma.sg.est@gmail.com
56087925	SG - BELKIS DIAZ ARIÑO	SG	diazarinob.sg.est@gmail.com
1089904641	SG - JULIETH TATIANA HERMOSA GUERRERO	SG	hermosaguerrerojt.sg.est@gmail.com
1102829926	SG - ANYELIN ARRIETA HERRERA	SG	arrietaherreraa.sg.est@gmail.com
1124852089	SG - EVELYN SOFÍA GUENIS GAVIRIA	SG	guenisgaviriaes.sg.est@gmail.com
1052630861	SG - SANTIAGO JOSE BARRAZA RODRIGUEZ	SG	barrazarodriguezsj.sg.est@gmail.com
1063486662	SG - SHAROL VANESSA MORALES OSPINO	SG	moralesospinosv.sg.est@gmail.com
1066605786	IETAC - XIMENA ARIAS MANCO	IETAC	ariasmancox.sg.est@gmail.com
1066605793	IETAC - CAMILO ANDRÉS ARROYO CASTRO	IETAC	arroyocastroca.sg.est@gmail.com
1063290755	IETAC - JAIRO MANUEL BALTAZAR VILLERO	IETAC	baltazarvillerojm.sg.est@gmail.com
1063292674	IETAC - LIZ VALERIA GIL HOYOS	IETAC	gilhoyoslv.sg.est@gmail.com
1101447212	IETAC - HERNÁN ANDRÉS PALMERA PÉREZ	IETAC	palmeraperezhf.sg.est@gmail.com
1066606386	IETAC - JOHAN ANDRÉS SALCEDO BEDOYA	IETAC	salcedobedoyaja.sg.est@gmail.com
1148695567	IETAC - KAREN ARRIETA VERGARA	IETAC	arrietavergaraks.sg.est@gmail.com
1033373778	IETAC - ANA BELÉN BARÓN CEBALLOS	IETAC	baronceballosab.sg.est@gmail.com
1063292595	IETAC - KAREN DAYANA CASTILLO PÉREZ	IETAC	castilloperezka.sg.est@gmail.com
1066572003	IETAC - JUAN DAVID CORREA HERNÁNDEZ	IETAC	correahernandezjd.sg.est@gmail.com
1133790727	IETAC - YULISA RODRÍGUEZ RODRÍGUEZ	IETAC	rodriguezrodriguezy.sg.est@gmail.com
1063295162	IETAC - DAINER ANDRÉS SÁNCHEZ CASTRO	IETAC	sanchezcastroda.sg.est@gmail.com
1148438017	IETAC - MARIANA DE JESÚS CABADIA PARRA	IETAC	cabadiaparramd.sg.est@gmail.com
1148695511	IETAC - JANER CASTRO MONTALVO	IETAC	castromontalvoj.sg.est@gmail.com
1063293969	IETAC - ELIANA MARCELA VERGARA GANDIA	IETAC	vergaragandiaem.sg.est@gmail.com
1133790340	IETAC - YULEIMIS MURILLO GÓMEZ	IETAC	murillogomezy.sg.est@gmail.com
1148438554	IETAC - NICOL TATIANA CERPA PEINADO	IETAC	cerpapeinadont.sg.est@gmail.com
1133790845	IETAC - DARY LUZ RAMOS	IETAC	ramosdl.sg.est@gmail.com
1063362733	IETAC - KEVIN ANDRES MEJIA LEMUS	IETAC	mejialemuska.sg.est@gmail.com
1133790491	IETAC - SAMIR MANUEL SUREZ ENSUNCHO	IETAC	surezensunchosm.sg.est@gmail.com
1148695599	IETAC - NEIVER CORDOBA ARGUMEDO	IETAC	cordobaargumedon.sg.est@gmail.com
1066605485	IETAC - SHARON LISHELL RODRIGUEZ OSORIO	IETAC	rodriguezosoriosl.sg.est@gmail.com
1014992221	SG - ANGIE SOFIA ALDANA ARIAS	SG	aldanaariasas.sg.est@gmail.com
1115690260	SG - LAURA SOFÍA OVEJERO MALDONADO	SG	overeromaldonadols.sg.est@gmail.com
1049935197	SG - KAMILA INES HERRERA MARTINEZ	SG	herreramartiniki.sg.est@gmail.com
1041981827	SG - VALERIE GAMARRA FONTALVO	SG	gamarrafontalvov.sg.est@gmail.com
1063158765	SG - ANGIE CAROLINA SOTO GIRALDO	SG	sotogiraldoac.sg.est@gmail.com
1077726158	SG - JUAN DIEGO ZAMBRANO OCAMPO	SG	zambranoocanpojd.sg.est@gmail.com
1142715366	SG - STEPHANY VELAZCO RODRIGUEZ	SG	velazcorodriguezs.sg.est@gmail.com
1077230281	SG - ISABELA BARREIRO CÁRDENAS	SG	barreirocardnasi.sg.est@gmail.com
1051066924	SG - JUAN SEBASTIAN RIVERA AVENDAÑO	SG	riveraavendanojs.sg.est@gmail.com
1061717282	SG - KAREN YULIED ARENAS COMETA	SG	arenascometaky.sg.est@gmail.com
1104821599	SG - LUIS ANTONIO MUÑOZ HINCAPIE	SG	munozhincapiela.sg.est@gmail.com
1103950959	SG - ADRIANA ISABEL HOYOS HOYOS	SG	hoyoshoyosai.sg.est@gmail.com
1099205249	SG - CAREN YILENI ECHEVERRÍA CARDOZO	SG	echeverriacardocy.sg.est@gmail.com
1043975755	SG - CRISTIAN DE JESÚS CUESTA BLANQUICETT	SG	cuestablanquicd.sg.est@gmail.com
1104547717	SG - NATALIA CARVAJAL VERGARA	SG	carvajalvergaran.sg.est@gmail.com
1120099332	SG - SAHRA ELIZABETH PUJIMUY ROBLES	SG	pujimuyroblessc.sg.est@gmail.com
1143241184	SG - MATHIAS JOSÉ HERNÁNDEZ BERMÚDEZ	SG	hernandezbermudmj.sg.est@gmail.com
1098678852	SG - MIGUEL ANGEL AYALA PRIETO	SG	ayalaprietoma.sg.est@gmail.com
1142921241	SG - JUAN CAMILO URIBE CUESTA	SG	uribecuestajc.sg.est@gmail.com
1095530126	SG - YURI NATALIA SARMIENTO SILVA	SG	sarmientosilvaya.sg.est@gmail.com
1061741898	SG - MARÍA JOSÉ CORTES CHALITAS	SG	corteschalitasmj.sg.est@gmail.com
1143340255	SG - SOFIA MÚNERA LÓPEZ	SG	muneralopezs.sg.est@gmail.com
5420076	SG - ROSA INES REVEROL GONZALEZ	SG	reverolonzalezri.sg.est@gmail.com
1088826978	SG - SALOME DUQUE BETANCURT	SG	duquebetancurts.sg.est@gmail.com
1097912847	SG - ROSA MENDIETA FONSECA	SG	mendietafonscar.sg.est@gmail.com
1118366654	SG - JHOAN DAVID LEÓN LAGOS	SG	leonlagosjd.sg.est@gmail.com
1062437352	SG - TALIANA ANDREA FLOREZ SALGADO	SG	florezsalgadota.sg.est@gmail.com
1043594698	SG - EMMA ISABELLA LINDADO ALGARIN	SG	lindadoalgarinei.sg.est@gmail.com
1126704313	SG - CLAUDIA VALENTINA OSORIO GOMEZ	SG	osoriogomezcv.sg.est@gmail.com
1023381412	SG - DANIELA SOFÍA FLOREZ VARGAS	SG	florezvargasds.sg.est@gmail.com
1110296142	SG - MARIANA DÍAZ ZÚÑIGA	SG	diazzunigam.sg.est@gmail.com
1095925977	SG - MARIA PAULA CARBALLO QUINTERO	SG	carballoquintmp.sg.est@gmail.com
1023084237	SG - JUAN FRANCISCO CAMACHO POSSO	SG	camachopossojf.sg.est@gmail.com
1047430590	SG - NICOLLE MARMOLEJO LUNA	SG	marmoleolunan.sg.est@gmail.com
1016036708	SG - CAMILA ALEJANDRA RAMIREZ RUEDA	SG	ramirezruedaca.sg.est@gmail.com
1043658548	SG - MARGREYS QUINTERO PALOMINO	SG	quinteropalominom.sg.est@gmail.com
1146334161	SG - DANIEL FELIPE MOTTA PILONIETA	SG	mottapilonietadf.sg.est@gmail.com
1062439947	SG - MARÍA PAULA TAPIA YEPES	SG	tapiayepesmp.sg.est@gmail.com
1025062800	SG - GABRIEL SUTACHAN MENDEZ	SG	sutachanmendezg.sg.est@gmail.com
1097102695	SG - MARÍA JULIETH CASTILLO BAUTISTA	SG	castillobautimj.sg.est@gmail.com
1028663171	SG - DIANA MARCELA MANBUSCAY AGUDELO	SG	manbuscayaguddm.sg.est@gmail.com
1097495125	SG - GISELL LETIZIA DUARTE CALDERÓN	SG	duartecalderongl.sg.est@gmail.com
1058933116	SG - VALERIA AUSECHA CAMPO	SG	ausechacampov.sg.est@gmail.com
1169713061	SG - KIARA CALDERA CORONADO	SG	calderacoronadok.sg.est@gmail.com
1093434369	SG - DULCE MARÍA ROJAS TARAZONA	SG	rojastarazonadm.sg.est@gmail.com
1080053987	SG - ÁNGEL GABRIEL GÓMEZ	SG	gomezag.sg.est@gmail.com
1080052995	SG - KEVIN SANTIAGO PORTILLO BENAVIDES	SG	portillobenavidks.sg.est@gmail.com
1058547636	SG - MARÍA PAULA PÉREZ HORMIGA	SG	perezhormigamp.sg.est@gmail.com
1114241878	SG - MARIA JOSE GUTIERREZ OSORIO	SG	gutierrezosiomj.sg.est@gmail.com
1059242362	SG - LAURA CAMILA GUZMÁN LÓPEZ	SG	guzmanlopezlc.sg.est@gmail.com
1044637051	SG - JUAN ANDRES ECHEVERRÍA ESCOBAR	SG	echeverriaescobja.sg.est@gmail.com
1055359068	SG - MARIA JOSE OSSA CUERVO	SG	ossacuervomj.sg.est@gmail.com
1042587442	SG - SAMARA CARO ORTEGA	SG	carootegas.sg.est@gmail.com
1096069283	SG - MARÍA DANIELA VERA VILLAMIZAR	SG	veravillamizarmd.sg.est@gmail.com
1044918208	SG - MARÍA ALEJANDRA RODRIGUEZ CANDURY	SG	rodriguezcanduma.sg.est@gmail.com
1050096058	SG - CRISTIAN DAVID FAJARDO PERILLA	SG	fajardoperillacd.sg.est@gmail.com
1030280214	SG - MARLONG FRRNEY CASAS RONDON	SG	casasrondonmf.sg.est@gmail.com
1098073581	SG - DARLY SARAY PÉREZ JAIMES	SG	perezjaimesds.sg.est@gmail.com
1110296676	SG - SALOMÉ DIAZ VALENCIA	SG	diazvalencias.sg.est@gmail.com
1097496452	SG - JULIETH VANESSA BECERRA MORA	SG	becerramorajv.sg.est@gmail.com
1105840578	SG - DANIELA MANCHOLA TORRES	SG	mancholaTorresd.sg.est@gmail.com
1065892631	SG - GABRIELA CASTIBLANCO WILCHES	SG	castiblancowilcg.sg.est@gmail.com
1065893790	SG - MARÍA FERNANDA SANTANA RAMÍREZ	SG	santanaramirezmf.sg.est@gmail.com
1053787841	SG - ANDREA VALENTINA RAMÍREZ OCHOA	SG	ramirezochoaav.sg.est@gmail.com
1106633208	SG - VALENTINA ESPINOSA ARIAS	SG	espinosaariasv.sg.est@gmail.com
1069485344	SG - SHEYLA DE JESUS AVILEZ VEGA	SG	avilezvegasd.sg.est@gmail.com
1077726354	SG - SARA SOFIA ESQUIVEL VARGAS	SG	esquivelvargasss.sg.est@gmail.com
1062440492	SG - JULIANA BORJA BUELVAS	SG	borjabuelvasj.sg.est@gmail.com
1104261261	SG - LEYSA LUZ MARTINEZ MENDOZA	SG	martinezmendozall.sg.est@gmail.com
1028006716	SG - ALEJANDRO DAVID LORA TORRES	SG	loratoresad.sg.est@gmail.com
1155214375	SG - JUAN PABLO MONTOYA ZAPATA	SG	montoyazapatajp.sg.est@gmail.com
1128327871	SG - JOSIAS ACUÑA ARIAS	SG	acunaariasj.sg.est@gmail.com
1075796399	SG - ISABEL SOFIA PEÑA GARCIA	SG	penagarciis.sg.est@gmail.com
1106228690	SG - HANNA NICOLLE TREJOS APACHE	SG	trejosapachehn.sg.est@gmail.com
1048282378	SG - JOSE ALEJANDRO SUAREZ BASTIDAS	SG	suarezbastidaja.sg.est@gmail.com
1126644594	SG - SAMANTHA CALA MARTÍNEZ	SG	calamartinezs.sg.est@gmail.com
1013126436	SG - LUIS FELIPE ESCUDERO VILLEGAS	SG	escuderovllegalf.sg.est@gmail.com
6734964	SG - YUNIOR LEONEL MORA BUSTAMANTE	SG	morabustamantyl.sg.est@gmail.com
1057980839	SG - PAULA SOFIA LOPEZ GARCÍA	SG	lopezgarciaps.sg.est@gmail.com
1149685659	SG - DAGINVE COLLAZOS TRUJILLO	SG	collazostrujillod.sg.est@gmail.com
1057842601	SG - SAMUEL FELIPE PARRA PULIDO	SG	parrapulidosf.sg.est@gmail.com
1050607301	SG - JOSÉ ÁNGEL SORA MERCHAN	SG	soramerchanja.sg.est@gmail.com
1096540557	SG - ISABELLA VÁSQUEZ CASAS	SG	vasquezcasasi.sg.est@gmail.com
1121538385	SG - GEISON RAFAEL ORTEGA BARRAZA	SG	ortegabarrazagr.sg.est@gmail.com
1062439459	SG - MARÍA ÁNGEL OJEDA SÁENZ	SG	ojedasaenzma.sg.est@gmail.com
1114882979	SG - JOSE MIGUEL URREA GÓMEZ	SG	urreagomezjm.sg.est@gmail.com
1007602728	SG - NUBIA LISETH MORA HERMOZO	SG	morahermozonl.sg.est@gmail.com
1030241016	SG - ALEX SIERRA BENÍTEZ	SG	sierrabeniteza.sg.est@gmail.com
1068138658	SG - JULIO PRADO BARRIOS	SG	pradobarriosj.sg.est@gmail.com
100662617	SG - NATALIE ISABEL VILLEGAS ORTIZ	SG	villegasortizni.sg.est@gmail.com
1109543289	SG - ESTEBAN PUENTES SARMIENTO	SG	puentessarmientoe.sg.est@gmail.com
1082923326	SG - MARÍA JOSÉ BRUGES CANTILLO	SG	brugescantillomj.sg.est@gmail.com
1116496163	SG - NESTOR GABRIEL SILVA BAHAMON	SG	silvabahamonng.sg.est@gmail.com
1069128754	SG - LAURA MADELEINE GÓMEZ SUÁREZ	SG	gomezsuarezlm.sg.est@gmail.com
1086103712	SG - BRAYAN JAVIER CHINGAL INGUILAN	SG	chingalinguilanbj.sg.est@gmail.com
1058968986	SG - ANGELA VIVIANA ACOSTA PERAFAN	SG	acostaperafanav.sg.est@gmail.com
1019903782	SG - MIGUEL ANDRÉS RHENALS ARGUMEDO	SG	rhenalsargumedoma.sg.est@gmail.com
1064717055	SG - LORENA ANDREA RODRÍGUEZ MARTÍNEZ	SG	rodriguezmartinezla.sg.est@gmail.com
1110491048	SG - MARIANA GABRIELA MORA MORENO	SG	moramorenomg.sg.est@gmail.com
1103743506	SG - DAYANA MISHEL TOVIA CHAVEZ	SG	toviachavezdm.sg.est@gmail.com
1049828142	SG - ANDRES FELIPE OROZCO ARRIOLA	SG	orozcoarriolaaf.sg.est@gmail.com
1042608024	SG - ISABELLA TAPIA ROMERO	SG	tapiaromeroi.sg.est@gmail.com
1118370393	SG - SAMUEL DAVID JARAMILLO LOAIZA	SG	jaramilloloaizasd.sg.est@gmail.com
1143125505	SG - HILAYDA ROSA CANTILLO RUZ	SG	cantilloruzhr.sg.est@gmail.com
1003004819	SG - GLORIA CAROLINA HUMANEZ TOBAR	SG	humaneztobargc.sg.est@gmail.com
1059235929	SG - DIANA CAROLINA RUIZ	SG	ruizdc.sg.est@gmail.com
1029666834	SG - JANNA YALID NORE PÉREZ	SG	noreperezjy.sg.est@gmail.com
1106635223	SG - DAIRON STEEVEN PEÑA CERQUERA	SG	penacerqueradst.sg.est@gmail.com
6596001	SG - RAYLEE CRISTINA SILVA HOYOS	SG	silvahoyosrc.sg.est@gmail.com
1043981466	SG - CAMILO ANDRES FUKEN MENDEZ	SG	fukenmendezca.sg.est@gmail.com
1050095073	SG - LAURA SOFIA RIASCOS PANTOJA	SG	riascospantojals.sg.est@gmail.com
1059602913	SG - DANNA VALENTINA SALAZAR AVIRAMA	SG	salazaraviramadv.sg.est@gmail.com
1130272053	SG - JESUS IVAN MIRANDA VARELO	SG	mirandavareljoi.sg.est@gmail.com
1041088008	SG - VALENTINA PEÑA VERGARA	SG	penavergarav.sg.est@gmail.com
1082156310	SG - GERSON GIOVANI ROJAS PISSO	SG	rojaspissog.sg.est@gmail.com
1044918807	SG - YEIMI PAOLA BARRAGAN BABILONIA	SG	barraganbabiloniayp.sg.est@gmail.com
1103743218	SG - JHON CARLOS RODRIGUEZ MENDOZA	SG	rodriguezmendozajc.sg.est@gmail.com
1110046760	SG - DANNA ALEJANDRA RECALDE RODRÍGUEZ	SG	recalderodriguezda.sg.est@gmail.com
1093299319	SG - KAREN GABRIELA LOPEZ PEDROZO	SG	lopezpedrozokpg.sg.est@gmail.com
1080056247	SG - DANIEL SANTIAGO DE LA CRUZ	SG	delacruzds.sg.est@gmail.com
1023383635	SG - THOMAS MUÑOZ FLOREZ	SG	munozflorezt.sg.est@gmail.com
1065883810	SG - SAMUEL LOAIZA ZAMBRANO	SG	loaizazambranos.sg.est@gmail.com
1061727773	SG - KAROL IVETH CAMACHO RENGIFO	SG	camachorengifoki.sg.est@gmail.com
1058548815	SG - SARA VALENTINA ACOSTA YACUMAL	SG	acostayacumalsv.sg.est@gmail.com
1061794207	SG - YESSICA PAOLA RUIZ RUIZ	SG	ruizruizyp.sg.est@gmail.com
1065203418	SG - CAMILO ANDRES COTES PAEZ	SG	cotespaezca.sg.est@gmail.com
1030203848	SG - DAVID SANTIAGO RAMÍREZ SALGADO	SG	ramírezsalgadods.sg.est@gmail.com
1089486569	SG - ANDERSON AMILKAR BECERRA IMBAJOA	SG	becerraimbajoaaa.sg.est@gmail.com
1079913946	SG - SHERIN YULIANA VERGARA GÜETTE	SG	vergaraguettesy.sg.est@gmail.com
1107979320	SG - VALENTINA SANDOVAL DIAZ	SG	sandovaldiazv.sg.est@gmail.com
1014293473	SG - PAULA ANDREA VERGARA PARRA	SG	vergaraparrapa.sg.est@gmail.com
1029520090	SG - JULIAN ESTIBEN CHIVATA OTALORA	SG	chivataotaloraje.sg.est@gmail.com
1030000485	SG - SOFÍA VALENTINA GOYES VALLEJO	SG	goyesvallejosv.sg.est@gmail.com
1043155307	SG - CARLOS ANDRÉS CHARRIS BONETT	SG	charrisbonettca.sg.est@gmail.com
1050611900	SG - JAVIER SANTIAGO PULIDO GONZALEZ	SG	pulidogonzalezjs.sg.est@gmail.com
1086300789	SG - ANGIE KATHERINE GUERRERO CUARAN	SG	guerrerocuaranak.sg.est@gmail.com
1123438139	SG - NIKOL VANESSA MANCILLA GONZALEZ	SG	mancillagonzaleznv.sg.est@gmail.com
1110048252	SG - MAVI SOFIA MICOLTA CARABALI	SG	micoltacaraballims.sg.est@gmail.com
1145826074	SG - LUCERO PAOLA LULIGO QUIRA	SG	luligoquiralp.sg.est@gmail.com
1019062951	SG - SARA MILETH BALVIN ARIAS	SG	balvinariassm.sg.est@gmail.com
1054870892	SG - SAMUEL DIAZ HOYOS	SG	samueldiazhoyos.sg.est@gmail.com
1077726901	SG - OSCAR ANDRES CANO SANCHEZ	SG	canosanchezoa.sg.est@gmail.com
1091974673	SG - YAMIR ALEJANDRO PÁEZ CACERES	SG	paezcaceresya.sg.est@gmail.com
1106518017	SG - MELANY SANCHEZ PION	SG	sanchezpionm.sg.est@gmail.com
1114819691	SG - JOSÉ MANUEL LONDOÑO LOPEZ	SG	londonolopezjm.sg.est@gmail.com
1179963601	SG - CHRISTOPHER DAVID ERAZO MONTERO	SG	erazomonterocd.sg.est@gmail.com
123456789	SG - USUARIO DE PRUEBA	SG	usuariodeprueba.sg.est@gmail.com"""

def parse_list(text):
    result = {}
    for line in text.strip().split('\n'):
        parts = line.split('\t')
        if len(parts) >= 4:
            id_est = parts[0].strip()
            nombre = parts[1].strip()
            # Limpiar prefijos IETAC/SG del nombre
            if nombre.startswith('IETAC - '):
                nombre = nombre[8:]
            elif nombre.startswith('SG - '):
                nombre = nombre[5:]
            email = parts[3].strip().lower()
            result[id_est] = {'n': nombre, 'e': email}
    return result

# Parsear ambas listas
datos1 = parse_list(lista1)
datos2 = parse_list(lista2)

# Combinar (lista1 tiene prioridad para correos personales)
todos = {}
for id_est, info in datos2.items():
    todos[id_est] = info
for id_est, info in datos1.items():
    todos[id_est] = info  # Sobrescribe con correos personales

# Crear auth_index
auth_index = [{'i': id_est, 'n': info['n'], 'e': info['e']} for id_est, info in todos.items()]

# Guardar
ruta_auth = os.path.join(BASE_DIR, 'reportes-sg-next', 'public', 'data', 'auth_index.json')
with open(ruta_auth, 'w', encoding='utf-8') as f:
    json.dump(auth_index, f, ensure_ascii=False, indent=2)

print(f'✅ auth_index.json actualizado: {len(auth_index)} estudiantes')
