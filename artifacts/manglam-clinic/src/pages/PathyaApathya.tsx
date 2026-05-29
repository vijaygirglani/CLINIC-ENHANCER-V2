import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Printer, Search, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";

type Lang = "gu" | "hi";

interface DiseaseSection {
  category: string;
  itemsEn: string[];
  itemsGu: string[];
  itemsHi: string[];
}

interface Disease {
  id: string;
  nameGu: string;
  nameHi: string;
  nameEn: string;
  group: string;
  causesGu: string[];
  causesHi: string[];
  pathya: DiseaseSection[];
  apathya: DiseaseSection[];
}

const groupLabels: Record<string, { hi: string; gu: string }> = {
  "Digestive Disorders":   { hi: "पाचन रोग",          gu: "પાचन रोग" },
  "Respiratory Disorders": { hi: "श्वास रोग",          gu: "શ્વास रोग" },
  "Metabolic Disorders":   { hi: "चयापचय रोग",         gu: "ચयापچय रोग" },
  "Joint & Pain":          { hi: "जोड़ व दर्द",        gu: "સांधा ने दर्द" },
  "Skin Disorders":        { hi: "त्वचा रोग",          gu: "ત्वचा रोग" },
  "Women's Health":        { hi: "महिला स्वास्थ्य",    gu: "Mahila Swasthya" },
  "Child Health":          { hi: "बाल स्वास्थ्य",      gu: "Bal Swasthya" },
  "Urinary Disorders":     { hi: "मूत्र रोग",          gu: "Mutra Rog" },
  "ENT & Head":            { hi: "ENT व सिर रोग",      gu: "ENT ने माथा रोग" },
  "Liver & Metabolic":     { hi: "यकृत रोग",           gu: "Yakrut Rog" },
  "Thyroid & Hormonal":    { hi: "थायरॉइड",            gu: "Thyroid" },
  "Mental & Lifestyle":    { hi: "मानसिक स्वास्थ्य",  gu: "Mansik Swasthya" },
  "Sexual & Reproductive": { hi: "प्रजनन स्वास्थ्य",  gu: "Prajanam Swasthya" },
  "Eye Disorders":         { hi: "नेत्र रोग",          gu: "Netra Rog" },
  "Panchakarma":           { hi: "पंचकर्म पथ्य",       gu: "Panchakarma Pathya" },
  "Seasonal (Ritucharya)": { hi: "ऋतुचर्या",           gu: "Ritucharya" },
  "Geriatric":             { hi: "वृद्धावस्था",         gu: "Vruddhavasta" },
};

const catLabels: Record<string, { hi: string; gu: string }> = {
  "Food":         { hi: "भोजन",           gu: "ભोजन" },
  "Grains":       { hi: "अनाज",           gu: "ધान्य" },
  "Vegetables":   { hi: "सब्जियां",        gu: "Shakbhaji" },
  "Fruits":       { hi: "फल",             gu: "Fal" },
  "Dairy":        { hi: "डेयरी",          gu: "Dairy" },
  "Drinks":       { hi: "पेय",            gu: "Peyna" },
  "Herbs":        { hi: "जड़ी-बूटी",      gu: "Oshad" },
  "Spices":       { hi: "मसाले",          gu: "Masala" },
  "Lifestyle":    { hi: "जीवनशैली",       gu: "Jeevanashaili" },
  "Therapy":      { hi: "उपचार",          gu: "Upchar" },
  "Habits":       { hi: "आदतें",          gu: "Tev" },
  "Environment":  { hi: "वातावरण",        gu: "Vatavaran" },
  "Digestives":   { hi: "पाचक",           gu: "Pachak" },
  "Oils":         { hi: "तेल",            gu: "Tel" },
};

const diseases: Disease[] = [

  // ══════════════════════════════════════════════════════
  //  DIGESTIVE DISORDERS  (Phase 1)
  // ══════════════════════════════════════════════════════
  {
    id:"amlapitta", group:"Digestive Disorders",
    nameGu:"અમ્લпित्त", nameHi:"अम्लपित्त", nameEn:"Hyperacidity / Acid Reflux",
    causesGu:["ખाटो-तीखो खोराक","Aniyamit bhajan","Cha / Coffee / Daaru","Tanav","Divasni Ughh"],
    causesHi:["खट्टा-तीखा भोजन","अनियमित भोजन","चाय / कॉफी / शराब","तनाव","दिन में सोना"],
    pathya:[
      {category:"Grains",   itemsEn:["Old rice, Wheat, Barley","Moong dal"],                      itemsGu:["જૂना चोखा, घऊं, जव","Mग दाळ"],           itemsHi:["पुराने चावल, गेहूं, जौ","मूंग दाल"]},
      {category:"Vegetables",itemsEn:["Bitter gourd, Parval, Tindora","Bottle gourd (Dudhi)"],   itemsGu:["કারेला, परवळ, तिंडोळा","Dudhi"],           itemsHi:["करेला, परवल, टिंडोरा","लौकी / दूधी"]},
      {category:"Drinks",   itemsEn:["Coconut water","Fennel-Jeera water","Buttermilk"],          itemsGu:["નाળियेर पाणी","Variyali-Jeera paani","Chaash"],itemsHi:["नारियल पानी","सौंफ-जीरा पानी","छाछ"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Maida, Bakery food","Fried foods, Pickles"],               itemsGu:["Medo, Bakari khorak","Talelun, Achaan"],    itemsHi:["मैदा, बेकरी भोजन","तला भोजन, अचार"]},
      {category:"Drinks",   itemsEn:["Tea, Coffee, Alcohol","Cold / fizzy beverages"],            itemsGu:["Cha, Coffee, Daaru","Thanda Peyna"],          itemsHi:["चाय, कॉफी, शराब","ठंडे / फिजी पेय"]},
    ],
  },
  {
    id:"ajirna", group:"Digestive Disorders",
    nameGu:"અجीर्ण / Apach", nameHi:"अजीर्ण / अपच", nameEn:"Indigestion / Dyspepsia",
    causesGu:["Zadpathi khavun","Vadhu khavun","Aniyamit bhajan","Tanav"],
    causesHi:["जल्दी खाना","ज्यादा खाना","अनियमित भोजन","तनाव"],
    pathya:[
      {category:"Food",     itemsEn:["Light moong-rice khichdi","Moong soup"],                   itemsGu:["Halki Mag-Chaval khichdi","Magnu Soup"],      itemsHi:["हल्की मूंग-चावल खिचड़ी","मूंग सूप"]},
      {category:"Digestives",itemsEn:["Ginger (Adrak)","Warm water","Jeera water"],              itemsGu:["Adun","Garam paani","Jeera paani"],            itemsHi:["अदरक","गर्म पानी","जीरा पानी"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Heavy meals","Fried food, Maida"],                         itemsGu:["Bhaare Bhajan","Talelun, Medo"],               itemsHi:["भारी भोजन","तला भोजन, मैदा"]},
      {category:"Habits",   itemsEn:["Cold drinks with food","Day sleep after meals"],            itemsGu:["Jamta Thanda Peyna","Jamya bad Divasni Ughh"], itemsHi:["खाने के साथ ठंडे पेय","खाने के बाद दिन में सोना"]},
    ],
  },
  {
    id:"vibandha", group:"Digestive Disorders",
    nameGu:"Vibandh / Kabaj", nameHi:"विबन्ध / कब्ज", nameEn:"Constipation",
    causesGu:["Ochun paani","Ochi fiber","Kasrat nathi","Icchha rokavi"],
    causesHi:["कम पानी","कम फाइबर","व्यायाम नहीं","वेग दबाना"],
    pathya:[
      {category:"Grains",   itemsEn:["Wheat roti with bran","Barley (Jav)"],                    itemsGu:["Chokar vaali rotli","Jav"],                   itemsHi:["चोकर वाली रोटी","जौ"]},
      {category:"Food",     itemsEn:["Papaya","Soaked fig (Anjeer)","Ghee in warm milk at night"],itemsGu:["Papaiyu","Palala Anjeer","Raatre garam dudhma Ghee"],itemsHi:["पपीता","भीगे अंजीर","रात में गर्म दूध में घी"]},
      {category:"Drinks",   itemsEn:["Warm water on empty stomach","Plenty of fluids"],          itemsGu:["Khali pet garam paani","Purtu paani pivun"],   itemsHi:["खाली पेट गर्म पानी","पर्याप्त पानी पीना"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Maida, Bakery food","Fried / heavy food","Dry food"],      itemsGu:["Medo, Bakari khorak","Talelun / Bhaaru bhajan","Sukun khavun"],itemsHi:["मैदा, बेकरी भोजन","तला / भारी भोजन","सूखा भोजन"]},
    ],
  },
  {
    id:"atisara", group:"Digestive Disorders",
    nameGu:"Atisaar / Zaada", nameHi:"अतिसार / दस्त", nameEn:"Diarrhea",
    causesGu:["Dushit khorak","Feriya khorak","Bacteria no chep","Tanav"],
    causesHi:["दूषित भोजन","बाहर का खाना","बैक्टीरिया संक्रमण","तनाव"],
    pathya:[
      {category:"Food",     itemsEn:["Rice water (Maad)","Moong khichdi","Pomegranate"],         itemsGu:["Chaval no Maad","Mag Khichdi","Dadam"],        itemsHi:["चावल का माड़","मूंग खिचड़ी","अनार"]},
      {category:"Drinks",   itemsEn:["ORS solution","Coconut water","Thin buttermilk"],          itemsGu:["ORS Ghol","Naaliyer paani","Patli Chaash"],    itemsHi:["ORS घोल","नारियल पानी","पतली छाछ"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Oily food","Milk excess in acute phase","Street food"],    itemsGu:["Teliyu khorak","Tivra tabaqqama vadhu dudh","Feriya khorak"],itemsHi:["तेलयुक्त भोजन","तीव्र अवस्था में दूध","बाहर का खाना"]},
    ],
  },
  {
    id:"grahani", group:"Digestive Disorders",
    nameGu:"ગ્રhani", nameHi:"ग्रहणी", nameEn:"IBS / Malabsorption",
    causesGu:["Aniyamit bhajan","Vadhu tel-masala","Dushit paani","Tanav"],
    causesHi:["अनियमित भोजन","अधिक तेल-मसाले","दूषित पानी","तनाव"],
    pathya:[
      {category:"Food",     itemsEn:["Old rice (Juna Chaval)","Thin moong dal","Ripe banana","Apple"],itemsGu:["Juna Chokhaa","Patli Mag Dal","Pakun Kelun","Safarzam"],itemsHi:["पुराने चावल","पतली मूंग दाल","पका केला","सेब"]},
      {category:"Drinks",   itemsEn:["Thin buttermilk (Chaas)","Jeera water","Coconut water"],   itemsGu:["Patli Chaash","Jeera paani","Naaliyer paani"], itemsHi:["पतली छाछ","जीरा पानी","नारियल पानी"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Fried / heavy food","Excess milk and curd","Excess spicy"], itemsGu:["Talelun / Bhaaru","Vadhu dudh ne dahi","Vadhu Tikhu"],itemsHi:["तला / भारी भोजन","अधिक दूध और दही","अधिक मसालेदार"]},
    ],
  },
  {
    id:"adhmana", group:"Digestive Disorders",
    nameGu:"Udhar Rog / Gas", nameHi:"उदर रोग / गैस", nameEn:"Bloating / Abdominal Gas",
    causesGu:["Gas kare eva khorak","Aniyamit khavun","Thanda peyna","Tanav"],
    causesHi:["गैस बनाने वाला भोजन","अनियमित खाना","ठंडे पेय","तनाव"],
    pathya:[
      {category:"Spices",   itemsEn:["Carom seeds (Ajwain)","Asafoetida (Hing)","Cumin (Jeera)"],itemsGu:["Ajmo","Hing","Jeeru"],                        itemsHi:["अजवाइन","हींग","जीरा"]},
      {category:"Drinks",   itemsEn:["Warm water throughout day","Ajwain boiled water"],         itemsGu:["Aakho divas Garam paani","Ajmanu ukaalu paani"],itemsHi:["दिनभर गर्म पानी","अजवाइन का उबला पानी"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Rajma, Chhole, Urad dal excess","Cauliflower, Sweet potato"],itemsGu:["Rajma, Chhola, Udad vadhu","Fulgobi, Shakkaria"],itemsHi:["राजमा, छोले, उड़द अधिक","फूलगोभी, शकरकंद"]},
      {category:"Drinks",   itemsEn:["Cold / fizzy beverages","Excess milk"],                    itemsGu:["Thanda / gas vaala Peyna","Vadhu Dudh"],       itemsHi:["ठंडे / फिजी पेय","अधिक दूध"]},
    ],
  },
  {
    id:"arsha", group:"Digestive Disorders",
    nameGu:"Arsh / Haras", nameHi:"अर्श / बवासीर", nameEn:"Piles / Hemorrhoids",
    causesGu:["Kabajiyat","Tikho khorak","Ochun paani","Lambo samy besthaa"],
    causesHi:["कब्ज","तीखा भोजन","कम पानी","लंबे समय बैठना"],
    pathya:[
      {category:"Food",     itemsEn:["Fibre-rich food","Papaya","Soaked fig (Anjeer)"],           itemsGu:["Fiber yukt khorak","Papaiyu","Palala Anjeer"],  itemsHi:["फाइबर युक्त आहार","पपीता","भीगे अंजीर"]},
      {category:"Drinks",   itemsEn:["Buttermilk (Chaas)","Warm water","2-3 litres daily"],      itemsGu:["Chaash","Garam paani","Roj 2-3 litre paani"],  itemsHi:["छाछ","गर्म पानी","रोज 2-3 लीटर पानी"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Spicy / chilli food","Fried / oily food"],                 itemsGu:["Tikho / marcha vaalo khorak","Talelun / Teliyu"],itemsHi:["तीखा / मिर्च वाला भोजन","तला / तेलयुक्त भोजन"]},
      {category:"Habits",   itemsEn:["Prolonged sitting","Suppressing urges"],                    itemsGu:["Lambo samay bethun rehevun","Icchha rokavi"],   itemsHi:["लंबे समय बैठना","वेग रोकना"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  RESPIRATORY DISORDERS  (Phase 1)
  // ══════════════════════════════════════════════════════
  {
    id:"kasa", group:"Respiratory Disorders",
    nameGu:"Kaas / Udhras", nameHi:"कास / खांसी", nameEn:"Cough (Kasa)",
    causesGu:["Thandi","Dhul / Dhumaado","Gala no chep","Suki hawa"],
    causesHi:["ठंड","धूल / धुआं","गले का संक्रमण","सूखी हवा"],
    pathya:[
      {category:"Food",     itemsEn:["Ginger (Adrak)","Honey (Madhu)","Turmeric milk","Warm water"],itemsGu:["Adun","Madh","Haldar-Dudh","Garam paani"],  itemsHi:["अदरक","शहद","हल्दी-दूध","गर्म पानी"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Ice cream","Cold drinks","Curd at night"],                 itemsGu:["Aais krim","Thanda peyna","Raatre Dahi"],     itemsHi:["आइसक्रीम","ठंडे पेय","रात में दही"]},
      {category:"Environment",itemsEn:["Dust exposure","Cold air / AC","Smoking"],               itemsGu:["Dhul no sampark","Thandi hawa / AC","Dhumrpan"],itemsHi:["धूल का संपर्क","ठंडी हवा / AC","धूम्रपान"]},
    ],
  },
  {
    id:"pratishyaya", group:"Respiratory Disorders",
    nameGu:"Pratishyaya / Shardi", nameHi:"प्रतिश्याय / जुकाम", nameEn:"Cold / Rhinitis",
    causesGu:["Thandi","Ritu-fer","Dhul-allergy","Raatre jagvun"],
    causesHi:["ठंड","मौसम परिवर्तन","धूल-एलर्जी","रात जागना"],
    pathya:[
      {category:"Herbs & Drinks",itemsEn:["Tulsi tea","Steam inhalation","Warm water","Ginger-honey tea"],itemsGu:["Tulsi Chai","Varal","Garam paani","Adun-Madh Chai"],itemsHi:["तुलसी चाय","भाप","गर्म पानी","अदरक-शहद चाय"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Cold foods","Ice cream","Cold drinks"],                    itemsGu:["Thando khorak","Aais krim","Thanda peyna"],   itemsHi:["ठंडा भोजन","आइसक्रीम","ठंडे पेय"]},
      {category:"Habits",   itemsEn:["Night awakening","Cold water bath","Dust exposure"],       itemsGu:["Raatre jagvun","Thundu snan","Dhul no sampark"],itemsHi:["रात जागना","ठंडा स्नान","धूल का संपर्क"]},
    ],
  },
  {
    id:"shwasa", group:"Respiratory Disorders",
    nameGu:"Shwas / Dam", nameHi:"श्वास / अस्थमा", nameEn:"Asthma (Shwasa)",
    causesGu:["Dhul","Allergen","Thando khorak","Dhumrpan","Tanav"],
    causesHi:["धूल","एलर्जन","ठंडा भोजन","धूम्रपान","तनाव"],
    pathya:[
      {category:"Food",     itemsEn:["Warm water","Ginger (Adrak)","Honey (Madhu)","Light meals"],itemsGu:["Garam paani","Adun","Madh","Halku Bhajan"],   itemsHi:["गर्म पानी","अदरक","शहद","हल्का भोजन"]},
      {category:"Lifestyle",itemsEn:["Breathing exercises (Pranayama)","Warm environment"],       itemsGu:["Pranayam","Garam vatavaran"],                  itemsHi:["प्राणायाम","गर्म वातावरण"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Cold foods","Curd","Fried food","Excess salt"],            itemsGu:["Thando khorak","Dahi","Talelun","Vadhu Mithu"],itemsHi:["ठंडा भोजन","दही","तला भोजन","अधिक नमक"]},
      {category:"Environment",itemsEn:["Dust","Smoking","Cold air","Strong fragrance"],           itemsGu:["Dhul","Dhumrpan","Thandi hawa","Tivra sugandh"],itemsHi:["धूल","धूम्रपान","ठंडी हवा","तेज खुशबू"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  METABOLIC DISORDERS  (Phase 1)
  // ══════════════════════════════════════════════════════
  {
    id:"madhumeha", group:"Metabolic Disorders",
    nameGu:"મधुमेह", nameHi:"मधुमेह", nameEn:"Diabetes / Madhumeha",
    causesGu:["Vadhu Khund","Kasrat nathi","Varsagat","Tanav","Sthulataa"],
    causesHi:["अधिक चीनी","व्यायाम नहीं","वंशानुगत","तनाव","मोटापा"],
    pathya:[
      {category:"Grains",   itemsEn:["Barley (Jav)","Bajra","Ragi","Moong dal"],                 itemsGu:["Jav","Bajro","Naglo","Mag Dal"],               itemsHi:["जौ","बाजरा","रागी","मूंग दाल"]},
      {category:"Vegetables",itemsEn:["Bitter gourd (Karela)","Fenugreek (Methi)","Spinach"],    itemsGu:["Karelaa","Methi","Palak"],                     itemsHi:["करेला","मेथी","पालक"]},
      {category:"Lifestyle",itemsEn:["Walking daily","Soaked Methi seeds on empty stomach"],     itemsGu:["Roj chalavun","Khali pet palala Methi na danna"],itemsHi:["रोज चलना","खाली पेट भीगी मेथी"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Sugar, Sweets / Mithai","Potato, Rice in excess"],         itemsGu:["Khund, Mithai","Batata, Vadhu Chokhaa"],       itemsHi:["चीनी, मिठाई","आलू, अधिक चावल"]},
      {category:"Fruits",   itemsEn:["Mango, Banana, Grapes","Chiku"],                           itemsGu:["Keri, Kelun, Drakh","Chiku"],                  itemsHi:["आम, केला, अंगूर","चीकू"]},
      {category:"Habits",   itemsEn:["Day sleep","Sedentary lifestyle"],                         itemsGu:["Divasni Ughh","Kasrat vigarna Jevan"],          itemsHi:["दिन में सोना","व्यायाम न करना"]},
    ],
  },
  {
    id:"sthoulya", group:"Metabolic Disorders",
    nameGu:"Sthoulay / Jadaapan", nameHi:"स्थौल्य / मोटापा", nameEn:"Obesity (Sthoulya)",
    causesGu:["Vadhu khavun","Talelun-mithai vadhu","Kasrat nathi","Divasni Ughh"],
    causesHi:["अधिक खाना","तला-मीठा अधिक","व्यायाम नहीं","दिन में सोना"],
    pathya:[
      {category:"Food",     itemsEn:["Barley (Jav)","Green vegetables","Honey water (morning)"], itemsGu:["Jav","Lila Shak","Madh-paani (savare)"],       itemsHi:["जौ","हरी सब्जियां","शहद-पानी (सुबह)"]},
      {category:"Lifestyle",itemsEn:["Regular exercise","Walking daily","Early dinner"],          itemsGu:["Niyamit Kasrat","Roj chalavun","Vahelu jamvun"],itemsHi:["नियमित व्यायाम","रोज चलना","जल्दी रात का खाना"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Fried foods","Sweets / Mithai","Excess oil"],              itemsGu:["Talelun","Mithai","Vadhu Tel"],                itemsHi:["तला भोजन","मिठाई","अधिक तेल"]},
      {category:"Habits",   itemsEn:["Day sleep","Sedentary lifestyle","Overeating"],             itemsGu:["Divasni Ughh","Kasrat vigarna","Vadhu khavun"],itemsHi:["दिन में सोना","व्यायाम न करना","अधिक खाना"]},
    ],
  },
  {
    id:"hypertension", group:"Metabolic Disorders",
    nameGu:"Uchch Raktachap", nameHi:"उच्च रक्तचाप", nameEn:"Hypertension / High B.P.",
    causesGu:["Vadhu Mithu","Talelun khorak","Tanav","Sthulataa","Dhumrpan"],
    causesHi:["अधिक नमक","तला भोजन","तनाव","मोटापा","धूम्रपान"],
    pathya:[
      {category:"Food",     itemsEn:["Barley, Oats","Garlic (Lasun)","Beetroot, Spinach","Fruits"],itemsGu:["Jav, Oats","Lasan","Bit, Palak","Falo"],     itemsHi:["जौ, ओट्स","लहसुन","चुकंदर, पालक","फल"]},
      {category:"Drinks",   itemsEn:["Coconut water","Pomegranate juice"],                        itemsGu:["Naaliyer paani","Dadam no ras"],               itemsHi:["नारियल पानी","अनार का रस"]},
      {category:"Lifestyle",itemsEn:["Low salt diet","Meditation (Dhyan)","Walking daily"],       itemsGu:["Ochun Mithu","Dhyan","Roj chalavun"],          itemsHi:["कम नमक","ध्यान","रोज चलना"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Excess salt","Pickles, Papad","Fried / oily food"],         itemsGu:["Vadhu Mithu","Achaan, Papad","Talelun / Teliyu"],itemsHi:["अधिक नमक","अचार, पापड","तला / तेलयुक्त भोजन"]},
      {category:"Habits",   itemsEn:["Stress","Smoking","Alcohol, excess Tea-Coffee"],            itemsGu:["Tanav","Dhumrpan","Daaru, Vadhu Cha-Coffee"], itemsHi:["तनाव","धूम्रपान","शराब, अधिक चाय-कॉफी"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  JOINT & PAIN  (Phase 1)
  // ══════════════════════════════════════════════════════
  {
    id:"sandhivata", group:"Joint & Pain",
    nameGu:"Sandhivat", nameHi:"संधिवात", nameEn:"Osteoarthritis / Joint Pain",
    causesGu:["Thanda khorak","Udad vadhu","Ummar","Ija"],
    causesHi:["ठंडे खाद्य","उड़द अधिक","उम्र","चोट"],
    pathya:[
      {category:"Food",     itemsEn:["Sesame (Til)","Fenugreek seeds","Warm food","Ghee"],        itemsGu:["Tal","Methina danna","Garam khorak","Ghee"],   itemsHi:["तिल","मेथी दाने","गर्म भोजन","घी"]},
      {category:"Therapy",  itemsEn:["Sesame oil massage (Abhyanga)","Warm compress"],             itemsGu:["Tal tel ni malish","Garam shek"],              itemsHi:["तिल तेल की मालिश","गर्म सिकाई"]},
      {category:"Lifestyle",itemsEn:["Gentle exercise","Warm environment"],                        itemsGu:["Halki kasrat","Garam vatavaran"],               itemsHi:["हल्का व्यायाम","गर्म वातावरण"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Cold water","Curd at night","Urad dal, Rajma"],             itemsGu:["Thundu paani","Raatre Dahi","Udad, Rajma"],    itemsHi:["ठंडा पानी","रात में दही","उड़द, राजमा"]},
      {category:"Habits",   itemsEn:["Cold water bath","Excess walking in acute phase"],           itemsGu:["Thundu snan","Tivra dard vakhte vadhu chalvun"],itemsHi:["ठंडा स्नान","तीव्र दर्द में अधिक चलना"]},
    ],
  },
  {
    id:"amavata", group:"Joint & Pain",
    nameGu:"Amavat (RA)", nameHi:"आमवात (RA)", nameEn:"Rheumatoid Arthritis",
    causesGu:["Aam bhego thavo","Dahi / khatu vadhu","Thundu-bhejavalu","Aniyamit bhajan"],
    causesHi:["आम का संचय","दही / खट्टा अधिक","ठंडी-नम जगह","अनियमित भोजन"],
    pathya:[
      {category:"Food",     itemsEn:["Dry ginger (Sunthi)","Warm water","Light meals","Methi"],  itemsGu:["Sunth","Garam paani","Halku bhajan","Methi"],  itemsHi:["सोंठ","गर्म पानी","हल्का भोजन","मेथी"]},
      {category:"Therapy",  itemsEn:["Castor oil (under supervision)","Warm oil massage"],         itemsGu:["Erand Tel (Doctor suchana)","Garam Tel malish"],itemsHi:["अरंडी तेल (चिकित्सक निर्देश)","गर्म तेल मालिश"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Curd (Dahi)","Heavy meals","Urad dal","Fried food"],        itemsGu:["Dahi","Bhaaru Bhajan","Udad","Talelun"],       itemsHi:["दही","भारी भोजन","उड़द","तला भोजन"]},
      {category:"Habits",   itemsEn:["Day sleep","Cold water exposure"],                           itemsGu:["Divasni Ughh","Thanda pani no sampark"],       itemsHi:["दिन में सोना","ठंडे पानी का संपर्क"]},
    ],
  },
  {
    id:"katishoola", group:"Joint & Pain",
    nameGu:"Katishul (Back Pain)", nameHi:"कटिशूल / कमर दर्द", nameEn:"Low Back Pain",
    causesGu:["Bhari uthavni","Lambo besthaa","Thandi","Khoti rit bethavun"],
    causesHi:["भारी उठाना","लंबे समय बैठना","ठंड","गलत मुद्रा"],
    pathya:[
      {category:"Food",     itemsEn:["Warm food","Ghee","Sesame (Til)"],                          itemsGu:["Garam khorak","Ghee","Tal"],                   itemsHi:["गर्म भोजन","घी","तिल"]},
      {category:"Therapy",  itemsEn:["Oil massage (Abhyanga)","Warm compress"],                   itemsGu:["Tel malish","Garam shek"],                     itemsHi:["तेल मालिश","गर्म सिकाई"]},
      {category:"Lifestyle",itemsEn:["Yoga","Proper rest"],                                        itemsGu:["Yog","Yogya Aaram"],                           itemsHi:["योग","उचित आराम"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Cold / refrigerated food","Excess dry food"],                itemsGu:["Thundu / fridge nu khorak","Vadhu sukhu khavun"],itemsHi:["ठंडा / फ्रिज का खाना","अधिक सूखा भोजन"]},
      {category:"Habits",   itemsEn:["Heavy lifting","Long sitting","Cold water bath"],            itemsGu:["Bhari uthavni","Lambo besthaa","Thundu snan"], itemsHi:["भारी उठाना","लंबे समय बैठना","ठंडा स्नान"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  SKIN DISORDERS  (Phase 2)
  // ══════════════════════════════════════════════════════
  {
    id:"dadru", group:"Skin Disorders",
    nameGu:"દાદ", nameHi:"दाद", nameEn:"Dadru / Fungal Infection",
    causesGu:["Vadhu pasevo","Bhejavalu vatavaran","Ochi rog pratikarak shakti","Synthetic kapda"],
    causesHi:["अधिक पसीना","नमी वाला वातावरण","कम प्रतिरोधक क्षमता","सिंथेटिक कपड़े"],
    pathya:[
      {category:"Food",     itemsEn:["Neem","Turmeric (Haldi)","Light diet"],                    itemsGu:["લીmडो","હળdar","Halko Khorak"],               itemsHi:["नीम","हल्दी","हल्का भोजन"]},
      {category:"Lifestyle",itemsEn:["Keep skin dry","Cotton clothes","Personal hygiene"],        itemsGu:["ત્vcha Suki Rakhavi","Suti kapda","Svacchhata"],itemsHi:["त्वचा सूखी रखें","सूती कपड़े","स्वच्छता"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Excess sweets","Oily food"],                               itemsGu:["વwadhu Mithai","Teliyu Khavun"],               itemsHi:["अधिक मिठाई","तेलयुक्त भोजन"]},
      {category:"Habits",   itemsEn:["Sweating without cleaning","Synthetic clothing"],           itemsGu:["Parsevo Rahi Javo","Synthetic Kapda"],        itemsHi:["पसीना साफ न करना","सिंथेटिक कपड़े"]},
    ],
  },
  {
    id:"vicharchika", group:"Skin Disorders",
    nameGu:"વicharchika", nameHi:"विचर्चिका", nameEn:"Vicharchika / Eczema",
    causesGu:["Allergy","Tanav","Machhli + Dudh","Chemical Saboo"],
    causesHi:["एलर्जी","तनाव","मछली + दूध","रासायनिक डिटर्जेंट"],
    pathya:[
      {category:"Food",     itemsEn:["Bitter vegetables","Neem","Old grains","Adequate hydration"],itemsGu:["તtikha Shak","Limdo","Juna Anaj","Purtu Paani"],itemsHi:["कड़वी सब्जियां","नीम","पुराने अनाज","पर्याप्त पानी"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Curd","Fish with milk","Junk food"],                       itemsGu:["dahi","Dudh Sathe Machhali","Jank Food"],      itemsHi:["दही","दूध के साथ मछली","जंक फूड"]},
    ],
  },
  {
    id:"kitibha", group:"Skin Disorders",
    nameGu:"સorayasis", nameHi:"सोरायसिस", nameEn:"Kitibha / Psoriasis",
    causesGu:["Tanav","Daaru","Khoti khorak jodi","Varsagat"],
    causesHi:["तनाव","शराब","गलत भोजन संयोग","वंशानुगत"],
    pathya:[
      {category:"Food",     itemsEn:["Neem","Bitter gourd (Karela)","Triphala","Meditation"],    itemsGu:["Limdo","Karelaa","Triphala","Dhyan"],          itemsHi:["नीम","करेला","त्रिफला","ध्यान"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Non-veg excess","Alcohol","Junk food"],                    itemsGu:["Vadhu Maansahar","Daaru","Jank Food"],         itemsHi:["अधिक मांसाहार","शराब","जंक फूड"]},
      {category:"Habits",   itemsEn:["Stress","Smoking"],                                         itemsGu:["Tanav","Dhumrpan"],                            itemsHi:["तनाव","धूम्रपान"]},
    ],
  },
  {
    id:"yauvana-pidika", group:"Skin Disorders",
    nameGu:"ખil", nameHi:"मुंहासे", nameEn:"Yauvana Pidika / Acne",
    causesGu:["Hormon asantulan","Teliyu khorak","Mode jaagvun","Kabajiyat"],
    causesHi:["हार्मोन असंतुलन","तेलयुक्त भोजन","देर से सोना","कब्ज"],
    pathya:[
      {category:"Food",     itemsEn:["Fruits","Green vegetables","Neem","Adequate sleep"],        itemsGu:["Fal","Lila Shak","Limdo","Purti Ughh"],        itemsHi:["फल","हरी सब्जियां","नीम","पर्याप्त नींद"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Fried foods","Chocolate excess","Late nights"],             itemsGu:["Talelun","Vadhu Chocolate","Mode Sudhi Jaagvun"],itemsHi:["तला भोजन","अधिक चॉकलेट","देर रात जागना"]},
    ],
  },
  {
    id:"sheetapitta", group:"Skin Disorders",
    nameGu:"Sheetapitta", nameHi:"शीतपित्त", nameEn:"Sheetapitta / Urticaria",
    causesGu:["Allergy khorak","Vadhu Tikhu","Thandi","Samudri khorak"],
    causesHi:["एलर्जिक भोजन","अधिक तीखा","ठंड","समुद्री भोजन"],
    pathya:[
      {category:"Food",     itemsEn:["Coriander water","Ghee","Cooling diet"],                   itemsGu:["Dhana Paani","Ghee","Thandakvaalo Khorak"],   itemsHi:["धनिया पानी","घी","शीतल आहार"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Seafood","Fermented food","Excess spicy food"],             itemsGu:["Samudri Khorak","Khaatu Khavun","Vadhu Tikhu"],itemsHi:["समुद्री भोजन","खट्टा भोजन","अधिक तीखा"]},
    ],
  },
  {
    id:"khalitya", group:"Skin Disorders",
    nameGu:"Vaal Kharva", nameHi:"बाल झड़ना", nameEn:"Khalitya / Hair Fall",
    causesGu:["Tanav","Poshan ni khami","Jank Food","Ochi Ughh"],
    causesHi:["तनाव","पोषण की कमी","जंक फूड","नींद की कमी"],
    pathya:[
      {category:"Food",     itemsEn:["Amla","Sesame (Til)","Milk (Dudh)","Stress reduction"],    itemsGu:["Aamla","Tal","Dudh","Tanav Ocho"],             itemsHi:["आंवला","तिल","दूध","तनाव कम"]},
      {category:"Therapy",  itemsEn:["Scalp oil massage"],                                         itemsGu:["Mathama Tel Malish"],                          itemsHi:["सिर में तेल मालिश"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Junk food","Excess salt / spice"],                         itemsGu:["Jank Food","Vadhu Mithu / Tikhu"],             itemsHi:["जंक फूड","अधिक नमक / मसाला"]},
      {category:"Habits",   itemsEn:["Stress","Sleep deprivation","Chemical hair products"],      itemsGu:["Tanav","Ochi Ughh","Chemical Hair Products"],  itemsHi:["तनाव","कम नींद","रासायनिक बाल उत्पाद"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  WOMEN'S HEALTH  (Phase 2)
  // ══════════════════════════════════════════════════════
  {
    id:"kashtartava", group:"Women's Health",
    nameGu:"Masik Dukhavo", nameHi:"मासिक दर्द", nameEn:"Kashtartava / Painful Menses",
    causesGu:["Vaat asantulan","Thando khorak vadhu","Tanav","Kasrat nathi"],
    causesHi:["वात असंतुलन","ठंडा भोजन अधिक","तनाव","व्यायाम नहीं"],
    pathya:[
      {category:"Food",     itemsEn:["Warm water","Ajwain","Rest","Light food"],                  itemsGu:["ગrm Paani","Ajmo","Aaram","Halko Khorak"],    itemsHi:["गर्म पानी","अजवाइन","आराम","हल्का भोजन"]},
      {category:"Therapy",  itemsEn:["Heat compress on lower abdomen"],                            itemsGu:["Pet par Garam Shek"],                          itemsHi:["पेट पर गर्म सिकाई"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Cold foods","Excess exercise"],                             itemsGu:["Thundu Khavun","Vadhu Kasrat"],                itemsHi:["ठंडा भोजन","अधिक व्यायाम"]},
      {category:"Habits",   itemsEn:["Stress","Cold water bath during periods"],                   itemsGu:["Tanav","Masik Darmiyan Thundu Snan"],          itemsHi:["तनाव","मासिक के दौरान ठंडा स्नान"]},
    ],
  },
  {
    id:"pcod", group:"Women's Health",
    nameGu:"Pecodi", nameHi:"पीसीओडी", nameEn:"PCOD / PCOS",
    causesGu:["Hormon asantulan","Jank Food","Kasrat nathi","Insulin Resistance"],
    causesHi:["हार्मोन असंतुलन","जंक फूड","व्यायाम नहीं","इंसुलिन प्रतिरोध"],
    pathya:[
      {category:"Food",     itemsEn:["Weight control","Exercise","Barley","Green vegetables"],    itemsGu:["Vajan Niyantran","Kasrat","Jav","Lila Shak"],  itemsHi:["वजन नियंत्रण","व्यायाम","जौ","हरी सब्जियां"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Junk food","Sugar excess","Fried food"],                   itemsGu:["Jank Food","Vadhu Khund","Talelun"],           itemsHi:["जंक फूड","अधिक चीनी","तला भोजन"]},
      {category:"Habits",   itemsEn:["Sedentary lifestyle","Irregular sleep"],                    itemsGu:["Kasrat no Abhav","Aniyamit Ughh"],             itemsHi:["व्यायाम की कमी","अनियमित नींद"]},
    ],
  },
  {
    id:"shweta-pradara", group:"Women's Health",
    nameGu:"Safed Paani", nameHi:"श्वेत प्रदर", nameEn:"Shweta Pradara / Leucorrhea",
    causesGu:["Asvachchhata","Vadhu Tikhu","Hormon asantulan","Kamjori"],
    causesHi:["अस्वच्छता","अधिक तीखा","हार्मोन असंतुलन","कमजोरी"],
    pathya:[
      {category:"Food",     itemsEn:["Pomegranate","Rice","Buttermilk","Proper hygiene"],         itemsGu:["Dadam","Chokhaa","Chaash","Svacchhata"],       itemsHi:["अनार","चावल","छाछ","स्वच्छता"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Excess spicy food","Poor hygiene"],                        itemsGu:["Vadhu Tikhu","Asvachchhata"],                  itemsHi:["अधिक तीखा","अस्वच्छता"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  CHILD HEALTH  (Phase 2)
  // ══════════════════════════════════════════════════════
  {
    id:"bal-shardi", group:"Child Health",
    nameGu:"Balkoma Varanvar Shardi", nameHi:"बच्चों में बार-बार जुकाम", nameEn:"Recurrent Cold in Children",
    causesGu:["Ochi rog pratikarak shakti","Vadhu thanda peyna","Dhul no sampark","Kamjor poshan"],
    causesHi:["कम रोग प्रतिरोध","ठंडे पेय अधिक","धूल का संपर्क","कमजोर पोषण"],
    pathya:[
      {category:"Food",     itemsEn:["Suvarnaprashan","Warm water","Tulsi","Nutritious food"],    itemsGu:["Suvarnaprashn","Garam Paani","Tulsi","Paushtik Aahar"],itemsHi:["सुवर्णप्राशन","गर्म पानी","तुलसी","पौष्टिक आहार"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Ice cream","Cold drinks","Dust exposure"],                  itemsGu:["Aais Krim","Thanda Peyna","Dhul"],             itemsHi:["आइसक्रीम","ठंडे पेय","धूल"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  URINARY DISORDERS  (Phase 2)
  // ══════════════════════════════════════════════════════
  {
    id:"mutrakriccha", group:"Urinary Disorders",
    nameGu:"Mutra ma Daazh", nameHi:"पेशाब में जलन", nameEn:"Mutrakriccha / Burning Urination",
    causesGu:["Ochun Paani","Vadhu Tikhu","Mutra Chep","Pitta asantulan"],
    causesHi:["कम पानी","अधिक तीखा","मूत्र संक्रमण","पित्त असंतुलन"],
    pathya:[
      {category:"Drinks",   itemsEn:["Coconut water","Coriander water","Plenty of fluids"],       itemsGu:["Naaliyer Paani","Dhana Paani","Purtu Paani"],  itemsHi:["नारियल पानी","धनिया पानी","पर्याप्त पानी"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Spicy food","Dehydration"],                                 itemsGu:["Tikhu Khavun","Paani Ochu Pivun"],             itemsHi:["तीखा भोजन","कम पानी"]},
    ],
  },
  {
    id:"ashmari", group:"Urinary Disorders",
    nameGu:"Pathari", nameHi:"पथरी", nameEn:"Ashmari / Kidney Stones",
    causesGu:["Ochun Paani","Vadhu Mithu","Oxalate vaalo khorak","Jank Food"],
    causesHi:["कम पानी","अधिक नमक","ऑक्सलेट युक्त भोजन","जंक फूड"],
    pathya:[
      {category:"Drinks",   itemsEn:["Coconut water","Barley water","Lemon water","3-4 litres daily"],itemsGu:["Naaliyer Paani","Javnu Paani","Limbu Paani","Roj 3-4 litre Paani"],itemsHi:["नारियल पानी","जौ पानी","नींबू पानी","रोज 3-4 लीटर पानी"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Dehydration","Excess salt","Junk food"],                    itemsGu:["Paani Ochu Pivun","Vadhu Mithu","Jank Food"],  itemsHi:["कम पानी पीना","अधिक नमक","जंक फूड"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  ENT & HEAD  (Phase 2)
  // ══════════════════════════════════════════════════════
  {
    id:"migraine", group:"ENT & Head",
    nameGu:"Aadhashishi", nameHi:"माइग्रेन", nameEn:"Migraine / Ardhavabhedaka",
    causesGu:["Tanav","Upvas","Vadhu Mobile","Aniyamit Ughh"],
    causesHi:["तनाव","उपवास","अधिक मोबाइल","अनियमित नींद"],
    pathya:[
      {category:"Food",     itemsEn:["Adequate sleep","Meditation","Cow ghee","Stress reduction"],itemsGu:["Purti Ughh","Dhyan","Gay nu Ghee","Tanav Ocho"],itemsHi:["पर्याप्त नींद","ध्यान","गाय का घी","तनाव कम"]},
    ],
    apathya:[
      {category:"Habits",   itemsEn:["Stress","Fasting","Excess screen time"],                    itemsGu:["Tanav","Upvas","Vadhu Mobile"],                itemsHi:["तनाव","उपवास","अधिक मोबाइल"]},
    ],
  },
  {
    id:"mukha-paka", group:"ENT & Head",
    nameGu:"Modhana Chhala", nameHi:"मुंह के छाले", nameEn:"Mouth Ulcers / Mukhapaka",
    causesGu:["Vadhu Tikhu","Vitamin ni khami","Tanav","Tamaku"],
    causesHi:["अधिक तीखा","विटामिन की कमी","तनाव","तंबाकू"],
    pathya:[
      {category:"Food",     itemsEn:["Ghee","Coconut water","Soft food"],                         itemsGu:["Ghee","Naaliyer Paani","Naram Khorak"],        itemsHi:["घी","नारियल पानी","नरम भोजन"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Spicy food","Hot food","Tobacco"],                          itemsGu:["Tikhu Khavun","Garam Khorak","Tamaku"],        itemsHi:["तीखा भोजन","गरम भोजन","तंबाकू"]},
    ],
  },
  {
    id:"sinusitis", group:"ENT & Head",
    nameGu:"Saainus", nameHi:"साइनस", nameEn:"Sinusitis",
    causesGu:["Thandi","Dhul Allergy","Pradushan","Kaph asantulan"],
    causesHi:["ठंड","धूल एलर्जी","प्रदूषण","कफ असंतुलन"],
    pathya:[
      {category:"Therapy",  itemsEn:["Steam inhalation","Nasya (Nasal oil drops)","Warm water"],  itemsGu:["Varal","Nasya","Garam Paani"],                 itemsHi:["भाप","नस्य","गर्म पानी"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Ice cream","Cold foods","Curd"],                            itemsGu:["Aais Krim","Thando Khorak","Dahi"],            itemsHi:["आइसक्रीम","ठंडा भोजन","दही"]},
      {category:"Environment",itemsEn:["Dust","Cold exposure","AC excess"],                        itemsGu:["Dhul","Thandi","Vadhu AC"],                    itemsHi:["धूल","ठंड","अधिक AC"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  LIVER & METABOLIC  (Phase 3)
  // ══════════════════════════════════════════════════════
  {
    id:"fatty-liver", group:"Liver & Metabolic",
    nameGu:"ফeटी Liver", nameHi:"फैटी लिवर", nameEn:"Fatty Liver",
    causesGu:["Daaru","Talelun-Khund vadhu","Sthulataa","Kasrat nathi"],
    causesHi:["शराब","तला-चीनी अधिक","मोटापा","व्यायाम नहीं"],
    pathya:[
      {category:"Food",     itemsEn:["Barley","Green vegetables","Bitter gourd","Warm water","Walking"],itemsGu:["Jav","Lila Shak","Karelaa","Garam Paani","Chalavun"],itemsHi:["जौ","हरी सब्जियां","करेला","गर्म पानी","चलना"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Alcohol","Fried foods","Sugar excess"],                    itemsGu:["Daaru","Talelun Khavun","Vadhu Khund"],        itemsHi:["शराब","तला भोजन","अधिक चीनी"]},
      {category:"Habits",   itemsEn:["Day sleep","Sedentary lifestyle"],                          itemsGu:["Divasni Ughh","Kasrat no Abhav"],              itemsHi:["दिन में सोना","व्यायाम की कमी"]},
    ],
  },
  {
    id:"kamala", group:"Liver & Metabolic",
    nameGu:"Kamlo", nameHi:"पीलिया", nameEn:"Kamala / Jaundice",
    causesGu:["Yakrut Chep","Dushit Paani","Daaru","Bhaare Bhajan"],
    causesHi:["यकृत संक्रमण","दूषित पानी","शराब","भारी भोजन"],
    pathya:[
      {category:"Drinks",   itemsEn:["Sugarcane juice","Coconut water","Moong soup","Rest"],      itemsGu:["Shedrano Ras","Naaliyer Paani","Magnu Sup","Aaram"],itemsHi:["गन्ने का रस","नारियल पानी","मूंग सूप","आराम"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Oily food","Alcohol","Heavy meals"],                        itemsGu:["Teliyu Khavun","Daaru","Bhaare Bhajan"],       itemsHi:["तेलयुक्त भोजन","शराब","भारी भोजन"]},
    ],
  },
  {
    id:"pandu", group:"Liver & Metabolic",
    nameGu:"Pandu / Lohini Unap", nameHi:"पांडु / खून की कमी", nameEn:"Pandu / Anemia",
    causesGu:["Iron ni khami","Vadhu Upvas","Jank Food","Apcho"],
    causesHi:["आयरन की कमी","अधिक उपवास","जंक फूड","कुअवशोषण"],
    pathya:[
      {category:"Food",     itemsEn:["Pomegranate","Dates","Beetroot","Amla"],                    itemsGu:["Dadam","Khajur","Bit","Aamla"],                itemsHi:["अनार","खजूर","चुकंदर","आंवला"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Junk food","Excess fasting"],                              itemsGu:["Jank Food","Vadhu Upvas"],                     itemsHi:["जंक फूड","अधिक उपवास"]},
      {category:"Habits",   itemsEn:["Tea with meals (reduces iron absorption)"],                 itemsGu:["Jamta Cha Pivi (loh avshosan ghatade)"],       itemsHi:["भोजन के साथ चाय (आयरन अवशोषण घटाती है)"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  THYROID & HORMONAL  (Phase 3)
  // ══════════════════════════════════════════════════════
  {
    id:"hypothyroidism", group:"Thyroid & Hormonal",
    nameGu:"Thyroid Ochu Karya", nameHi:"हाइपोथायरॉइड", nameEn:"Hypothyroidism",
    causesGu:["Kaph asantulan","Kasrat nathi","Iodine ni khami","Tanav"],
    causesHi:["कफ असंतुलन","व्यायाम न करना","आयोडीन की कमी","तनाव"],
    pathya:[
      {category:"Food",     itemsEn:["Exercise","Warm water","Light meals","Millets"],            itemsGu:["Kasrat","Garam Paani","Halko Khorak","Millets"],itemsHi:["व्यायाम","गर्म पानी","हल्का भोजन","मिलेट्स"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Heavy meals","Excess soy products"],                        itemsGu:["Bhaare Bhajan","Soya vadhu"],                  itemsHi:["भारी भोजन","अधिक सोया उत्पाद"]},
      {category:"Habits",   itemsEn:["Day sleep","Sedentary lifestyle"],                          itemsGu:["Divasni Ughh","Kasrat no Abhav"],              itemsHi:["दिन में सोना","व्यायाम की कमी"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  MENTAL & LIFESTYLE  (Phase 3)
  // ══════════════════════════════════════════════════════
  {
    id:"nidranasha", group:"Mental & Lifestyle",
    nameGu:"Nidranash", nameHi:"अनिद्रा", nameEn:"Nidranasha / Insomnia",
    causesGu:["Tanav","Vadhu Mobile","Raatre Cha-Coffee","Vaat asantulan"],
    causesHi:["तनाव","अधिक मोबाइल","रात में चाय-कॉफी","वात असंतुलन"],
    pathya:[
      {category:"Food",     itemsEn:["Warm milk","Meditation","Oil massage","Early sleep"],       itemsGu:["Garam Dudh","Dhyan","Tel Masaj","Vaheli Ughh"],itemsHi:["गर्म दूध","ध्यान","तेल मालिश","जल्दी सोना"]},
    ],
    apathya:[
      {category:"Habits",   itemsEn:["Excess mobile use","Tea-coffee at night","Stress"],         itemsGu:["Vadhu Mobile","Raatre Cha-Coffee","Tanav"],    itemsHi:["अधिक मोबाइल","रात में चाय-कॉफी","तनाव"]},
    ],
  },
  {
    id:"chinta", group:"Mental & Lifestyle",
    nameGu:"Chinta", nameHi:"चिंता", nameEn:"Chinta / Anxiety",
    causesGu:["Vadhu Vichar","Ochi Ughh","Tanav","Vaat asantulan"],
    causesHi:["अधिक सोचना","कम नींद","तनाव","वात असंतुलन"],
    pathya:[
      {category:"Food",     itemsEn:["Meditation","Brahmi","Pranayama","Proper sleep"],          itemsGu:["Dhyan","Brahmi","Pranayam","Purti Ughh"],      itemsHi:["ध्यान","ब्राह्मी","प्राणायाम","पर्याप्त नींद"]},
    ],
    apathya:[
      {category:"Habits",   itemsEn:["Overthinking","Sleep deprivation","Stress"],               itemsGu:["Vadhu Vichar","Ochi Ughh","Tanav"],            itemsHi:["अधिक सोचना","कम नींद","तनाव"]},
    ],
  },
  {
    id:"depression", group:"Mental & Lifestyle",
    nameGu:"Udasinata", nameHi:"अवसाद", nameEn:"Depression Supportive Care",
    causesGu:["Ekalata","Aniyamit Dincharya","Daaru","Dukh / Aaghat"],
    causesHi:["अकेलापन","अनियमित दिनचर्या","शराब","दुःख / आघात"],
    pathya:[
      {category:"Food",     itemsEn:["Counseling","Yoga","Meditation","Nutritious food"],         itemsGu:["Counseling","Yog","Dhyan","Paushtik Aahar"],  itemsHi:["काउंसलिंग","योग","ध्यान","पौष्टिक आहार"]},
    ],
    apathya:[
      {category:"Habits",   itemsEn:["Isolation","Alcohol","Irregular routine"],                  itemsGu:["Ekalata","Daaru","Aniyamit Jeevanashaili"],    itemsHi:["अकेलापन","शराब","अनियमित दिनचर्या"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  SEXUAL & REPRODUCTIVE  (Phase 3)
  // ══════════════════════════════════════════════════════
  {
    id:"shukra-kshaya", group:"Sexual & Reproductive",
    nameGu:"Shukra Kshay", nameHi:"शुक्र क्षय", nameEn:"Shukra Kshaya / Low Vitality",
    causesGu:["Tanav","Vadhu Sambhog","Raatre Jaagvun","Jank Food"],
    causesHi:["तनाव","अधिक संभोग","रात जागना","जंक फूड"],
    pathya:[
      {category:"Food",     itemsEn:["Milk","Ghee","Almonds","Ashwagandha"],                     itemsGu:["Dudh","Ghee","Badam","Ashwagandha"],           itemsHi:["दूध","घी","बादाम","अश्वगंधा"]},
    ],
    apathya:[
      {category:"Habits",   itemsEn:["Stress","Excess sexual activity","Night awakening"],        itemsGu:["Tanav","Vadhu Sambhog","Mode Sudhi Jaagvun"],  itemsHi:["तनाव","अधिक संभोग","देर रात जागना"]},
    ],
  },
  {
    id:"erectile-dysfunction", group:"Sexual & Reproductive",
    nameGu:"Napunsakata", nameHi:"नपुंसकता", nameEn:"Erectile Dysfunction",
    causesGu:["Tanav","Daaru","Dhumrpan","Madhumeh","Vaat asantulan"],
    causesHi:["तनाव","शराब","धूम्रपान","मधुमेह","वात असंतुलन"],
    pathya:[
      {category:"Food",     itemsEn:["Ashwagandha","Milk","Ghee","Healthy sleep"],               itemsGu:["Ashwagandha","Dudh","Ghee","Saari Ughh"],      itemsHi:["अश्वगंधा","दूध","घी","अच्छी नींद"]},
    ],
    apathya:[
      {category:"Habits",   itemsEn:["Smoking","Alcohol","Stress"],                               itemsGu:["Dhumrpan","Daaru","Tanav"],                    itemsHi:["धूम्रपान","शराब","तनाव"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  EYE DISORDERS  (Phase 3)
  // ══════════════════════════════════════════════════════
  {
    id:"eye-strain", group:"Eye Disorders",
    nameGu:"Aankh no Thak", nameHi:"आंखों की थकान", nameEn:"Eye Strain",
    causesGu:["Vadhu Mobile","Raatre Jaagvun","Pitta asantulan","Vitamin A ni khami"],
    causesHi:["अधिक मोबाइल","रात जागना","पित्त असंतुलन","विटामिन A की कमी"],
    pathya:[
      {category:"Therapy",  itemsEn:["Triphala eye wash","Eye exercises","Proper sleep"],        itemsGu:["Triphala Dhovan","Aankh Kasrat","Purti Ughh"], itemsHi:["त्रिफला धुलाई","आंख व्यायाम","पर्याप्त नींद"]},
    ],
    apathya:[
      {category:"Habits",   itemsEn:["Excess screen time","Night awakening"],                    itemsGu:["Vadhu Mobile","Modiraatre Jaagvun"],           itemsHi:["अधिक मोबाइल","देर रात जागना"]},
    ],
  },
  {
    id:"conjunctivitis", group:"Eye Disorders",
    nameGu:"Aankh Aavvi", nameHi:"आंख आना", nameEn:"Conjunctivitis",
    causesGu:["Aankh Chep","Dhul no sampark","Aankh Ghasvun","Ganda haat"],
    causesHi:["आंख संक्रमण","धूल का संपर्क","आंख रगड़ना","गंदे हाथ"],
    pathya:[
      {category:"Therapy",  itemsEn:["Eye hygiene","Cold compress","Rest"],                       itemsGu:["Aankh Svacchhata","Thandi Patti","Aaram"],     itemsHi:["आंख की सफाई","ठंडी पट्टी","आराम"]},
    ],
    apathya:[
      {category:"Habits",   itemsEn:["Dust exposure","Eye rubbing","Sharing eye drops"],          itemsGu:["Dhul","Aankh Ghasvun","Aankh Drops Vahechva"],itemsHi:["धूल","आंख मलना","आई-ड्रॉप साझा करना"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  PANCHAKARMA  (Phase 3)
  // ══════════════════════════════════════════════════════
  {
    id:"vamana-pathya", group:"Panchakarma",
    nameGu:"Vaman Pashchat Pathya", nameHi:"वमन पथ्य", nameEn:"Vamana Pathya (Post-Vamana Diet)",
    causesGu:["Panchakarma baad","Kaph Detox"],
    causesHi:["पंचकर्म के बाद","कफ डेटॉक्स"],
    pathya:[
      {category:"Food",     itemsEn:["Thin rice gruel","Moong soup","Light diet"],                itemsGu:["Patli Khichdi","Magnu Sup","Halko Khorak"],   itemsHi:["पतली खिचड़ी","मूंग सूप","हल्का भोजन"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Heavy food","Fried food","Cold water"],                     itemsGu:["Bhaare Bhajan","Talelun","Thundu Paani"],      itemsHi:["भारी भोजन","तला भोजन","ठंडा पानी"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  SEASONAL (RITUCHARYA)  (Phase 3)
  // ══════════════════════════════════════════════════════
  {
    id:"summer-ritucharya", group:"Seasonal (Ritucharya)",
    nameGu:"Unalu Ritucharya", nameHi:"ग्रीष्म ऋतुचर्या", nameEn:"Summer Ritucharya Diet",
    causesGu:["Unalama Pitta vadhe","Dehydration","Vadhu Tadako"],
    causesHi:["गर्मी में पित्त वृद्धि","निर्जलीकरण","अधिक धूप"],
    pathya:[
      {category:"Drinks",   itemsEn:["Coconut water","Buttermilk (Chaas)","Rose water"],         itemsGu:["Naaliyer Paani","Chaash","Gulab Jal"],         itemsHi:["नारियल पानी","छाछ","गुलाब जल"]},
      {category:"Food",     itemsEn:["Watermelon","Light food"],                                   itemsGu:["Tarbuch","Halko Khorak"],                      itemsHi:["तरबूज","हल्का भोजन"]},
    ],
    apathya:[
      {category:"Food",     itemsEn:["Spicy foods","Fried food","Less water intake"],              itemsGu:["Tikhu Khavun","Talelun","Paani Ochu Pivun"],  itemsHi:["तीखा भोजन","तला भोजन","कम पानी"]},
      {category:"Habits",   itemsEn:["Excess sun exposure"],                                       itemsGu:["Vadhu Tadako"],                                itemsHi:["अधिक धूप"]},
    ],
  },
  {
    id:"winter-ritucharya", group:"Seasonal (Ritucharya)",
    nameGu:"Shiyalu Ritucharya", nameHi:"शीत ऋतुचर्या", nameEn:"Winter Ritucharya Diet",
    causesGu:["Shiyalamaa Vaat vadhe","Suki Thandi Hawa","Pachan Shakti ghate"],
    causesHi:["सर्दी में वात वृद्धि","सूखी ठंडी हवा","पाचन शक्ति कम"],
    pathya:[
      {category:"Food",     itemsEn:["Ghee","Sesame (Til)","Warm food","Exercise"],               itemsGu:["Ghee","Tal","Garam Khorak","Kasrat"],          itemsHi:["घी","तिल","गर्म भोजन","व्यायाम"]},
      {category:"Therapy",  itemsEn:["Oil massage (Abhyanga)","Warm bath"],                       itemsGu:["Tel Malish","Garam Snan"],                     itemsHi:["तेल मालिश","गर्म स्नान"]},
    ],
    apathya:[
      {category:"Habits",   itemsEn:["Cold exposure","Excess fasting"],                           itemsGu:["Thandi","Vadhu Upvas"],                        itemsHi:["ठंड","अधिक उपवास"]},
    ],
  },

  // ══════════════════════════════════════════════════════
  //  GERIATRIC  (Phase 3)
  // ══════════════════════════════════════════════════════
  {
    id:"memory-weakness", group:"Geriatric",
    nameGu:"Yaadshakti Ochi", nameHi:"याददाश्त कमजोर", nameEn:"Memory Weakness",
    causesGu:["Tanav","Ochi Ughh","Vadhu Mobile","Vaat asantulan"],
    causesHi:["तनाव","कम नींद","अधिक मोबाइल","वात असंतुलन"],
    pathya:[
      {category:"Food",     itemsEn:["Brahmi","Almonds (Badam)","Meditation","Proper sleep"],     itemsGu:["Brahmi","Badam","Dhyan","Purti Ughh"],         itemsHi:["ब्राह्मी","बादाम","ध्यान","पर्याप्त नींद"]},
    ],
    apathya:[
      {category:"Habits",   itemsEn:["Stress","Sleep deprivation","Excess screen time"],          itemsGu:["Tanav","Ochi Ughh","Vadhu Mobile"],            itemsHi:["तनाव","कम नींद","अधिक मोबाइल"]},
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function printPathya() {
  const el = document.getElementById("print-pathya");
  if (!el) return;
  el.style.display = "block";
  window.print();
  el.style.display = "none";
}

const GROUP_ORDER = [
  "Digestive Disorders","Respiratory Disorders","Metabolic Disorders","Joint & Pain",
  "Skin Disorders","Women's Health","Child Health","Urinary Disorders","ENT & Head",
  "Liver & Metabolic","Thyroid & Hormonal","Mental & Lifestyle","Sexual & Reproductive",
  "Eye Disorders","Panchakarma","Seasonal (Ritucharya)","Geriatric",
];

export default function PathyaApathya() {
  const [lang, setLang]           = useState<Lang>("hi");
  const [patientName, setPatientName] = useState("");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<Disease>(diseases[0]);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["Digestive Disorders"]));

  const toggleGroup = (g: string) => setOpenGroups(prev => {
    const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n;
  });

  const selectDisease = (d: Disease) => {
    setSelected(d);
    setOpenGroups(prev => new Set([...prev, d.group]));
  };

  const gl   = (g: string) => lang === "gu" ? (groupLabels[g]?.gu || g) : (groupLabels[g]?.hi || g);
  const cl   = (c: string) => lang === "gu" ? (catLabels[c]?.gu  || c) : (catLabels[c]?.hi  || c);
  const getItems = (sec: DiseaseSection) =>
    lang === "gu" ? sec.itemsGu : lang === "hi" ? sec.itemsHi : sec.itemsEn;
  const getCauses = () => lang === "gu" ? selected.causesGu : selected.causesHi;
  const diseaseName = lang === "gu" ? selected.nameGu : selected.nameHi;
  const today = format(new Date(), "dd/MM/yyyy");

  const pathyaTitle  = lang === "gu" ? "Pathya — Shu Khavun" : "पथ्य — क्या खाएं";
  const apathyaTitle = lang === "gu" ? "Apathya — Shu Na Khavun" : "अपथ्य — क्या न खाएं";
  const causesTitle  = lang === "gu" ? "Karan (Nidana)" : "कारण (Nidana)";

  const filtered = search.length > 0
    ? diseases.filter(d =>
        d.nameGu.toLowerCase().includes(search.toLowerCase()) ||
        d.nameHi.toLowerCase().includes(search.toLowerCase()) ||
        d.nameEn.toLowerCase().includes(search.toLowerCase()))
    : null;

  const groupedDiseases = GROUP_ORDER.map(g => ({
    group: g, list: diseases.filter(d => d.group === g),
  })).filter(x => x.list.length > 0);

  return (
    <Layout>
      {/* ── Print area ── */}
      <div id="print-pathya" style={{ display:"none", fontFamily:"Arial, sans-serif", fontSize:"13px", padding:"20px", maxWidth:"720px", margin:"0 auto" }}>
        <table style={{ width:"100%", borderBottom:"3px double #2d6a4f", paddingBottom:"8px", marginBottom:"12px" }}>
          <tbody><tr>
            <td>
              <div style={{ fontSize:"18px", fontWeight:"900", color:"#2d6a4f" }}>Manglam Skin Care Clinic</div>
              <div style={{ fontSize:"11px", color:"#666" }}>Ayurvedic Dietary Guidelines — Pathya-Apathya</div>
            </td>
            <td style={{ textAlign:"right", verticalAlign:"top" }}>
              <div style={{ fontWeight:"bold" }}>Dr. Vijay Girglani</div>
              <div style={{ fontSize:"11px" }}>B.A.M.S., C.S.D. (Skin)</div>
              <div style={{ fontSize:"11px" }}>Reg. No. GBI 17318</div>
            </td>
          </tr></tbody>
        </table>
        <div style={{ background:"#2d6a4f", color:"#fff", padding:"8px 14px", borderRadius:"6px", marginBottom:"10px", display:"flex", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:"18px", fontWeight:"bold" }}>{diseaseName}</div>
            <div style={{ fontSize:"11px", opacity:0.85 }}>{selected.nameEn}</div>
          </div>
          <div style={{ fontSize:"12px", textAlign:"right" }}>
            {patientName && <div>Patient: {patientName}</div>}
            <div>Date: {today}</div>
          </div>
        </div>
        <div style={{ marginBottom:"10px", padding:"8px 12px", background:"#fff3cd", borderRadius:"6px" }}>
          <div style={{ fontWeight:"bold", fontSize:"12px", marginBottom:"4px" }}>{causesTitle}</div>
          <div>{getCauses().map((c,i) => <span key={i} style={{ background:"#ffc107", color:"#000", padding:"2px 8px", borderRadius:"12px", fontSize:"11px", marginRight:"6px", display:"inline-block", marginBottom:"4px" }}>{c}</span>)}</div>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>
            <th style={{ background:"#d1fae5", padding:"8px", border:"1px solid #a7f3d0", width:"50%" }}>✅ Pathya</th>
            <th style={{ background:"#fee2e2", padding:"8px", border:"1px solid #fca5a5", width:"50%" }}>❌ Apathya</th>
          </tr></thead>
          <tbody><tr>
            <td style={{ verticalAlign:"top", padding:"10px", border:"1px solid #d1fae5" }}>
              {selected.pathya.map((s,i) => <div key={i} style={{ marginBottom:"8px" }}><div style={{ fontWeight:"bold", fontSize:"11px", color:"#065f46" }}>{cl(s.category)}</div>{getItems(s).map((item,j) => <div key={j} style={{ fontSize:"12px" }}>• {item}</div>)}</div>)}
            </td>
            <td style={{ verticalAlign:"top", padding:"10px", border:"1px solid #fee2e2" }}>
              {selected.apathya.map((s,i) => <div key={i} style={{ marginBottom:"8px" }}><div style={{ fontWeight:"bold", fontSize:"11px", color:"#991b1b" }}>{cl(s.category)}</div>{getItems(s).map((item,j) => <div key={j} style={{ fontSize:"12px" }}>• {item}</div>)}</div>)}
            </td>
          </tr></tbody>
        </table>
      </div>

      {/* ── Main UI ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Sidebar ── */}
        <div className="lg:col-span-3 space-y-3">
          <div className="medical-card p-4 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Language</p>
            <div className="flex gap-2">
              <button onClick={() => setLang("hi")} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${lang==="hi" ? "bg-amber-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>हि — Hindi</button>
              <button onClick={() => setLang("gu")} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${lang==="gu" ? "bg-amber-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>ગu — Gujarati</button>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Patient Name (Optional)</label>
              <input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. Rajesh Shah"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-amber-400 text-slate-800 text-sm" />
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={lang === "hi" ? "बीमारी खोजें..." : "Rog Shodho..."}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-amber-400 text-slate-700 text-sm shadow-sm" />
          </div>

          <div className="medical-card overflow-hidden">
            {filtered ? (
              <>
                <div className="px-4 pt-3 pb-1 text-xs font-bold text-slate-400 uppercase">{filtered.length} results</div>
                <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                  {filtered.map(d => (
                    <button key={d.id} onClick={() => selectDisease(d)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-amber-50 transition-colors ${selected.id===d.id ? "bg-amber-50 border-l-4 border-amber-500" : ""}`}>
                      <p className={`text-sm font-bold leading-tight ${selected.id===d.id ? "text-amber-700" : "text-slate-800"}`}>{lang==="gu" ? d.nameGu : d.nameHi}</p>
                      <p className="text-xs text-slate-400">{d.nameEn}</p>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="max-h-[560px] overflow-y-auto">
                {groupedDiseases.map(({ group, list }) => (
                  <div key={group}>
                    <button onClick={() => toggleGroup(group)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 hover:bg-amber-100 transition-colors border-b border-amber-200">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">{gl(group)}</span>
                      {openGroups.has(group) ? <ChevronDown className="w-3.5 h-3.5 text-amber-500"/> : <ChevronRight className="w-3.5 h-3.5 text-amber-500"/>}
                    </button>
                    {openGroups.has(group) && (
                      <div className="divide-y divide-slate-50">
                        {list.map(d => (
                          <button key={d.id} onClick={() => selectDisease(d)}
                            className={`w-full text-left px-5 py-2.5 hover:bg-amber-50/60 transition-colors ${selected.id===d.id ? "bg-amber-50 border-l-4 border-amber-500" : ""}`}>
                            <p className={`text-sm font-semibold leading-tight ${selected.id===d.id ? "text-amber-700" : "text-slate-800"}`}>{lang==="gu" ? d.nameGu : d.nameHi}</p>
                            <p className="text-[11px] text-slate-400">{d.nameEn}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="lg:col-span-9">
          <div className="medical-card overflow-hidden">
            <div className="bg-emerald-800 text-white p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-x-2 mb-2 text-emerald-300 text-xs">
                  <BookOpen className="w-4 h-4"/>
                  <span>Manglam Skin Care Clinic · Dr. Vijay Girglani · B.A.M.S., C.S.D. · Reg. GBI 17318</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{diseaseName}</h2>
                <p className="text-emerald-300 text-sm mt-0.5">{selected.nameEn}</p>
              </div>
              <div className="text-right text-sm shrink-0">
                {patientName && <p className="text-emerald-200 font-medium">{patientName}</p>}
                <p className="text-emerald-300 text-xs">{today}</p>
                <button onClick={printPathya} className="mt-2 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors ml-auto">
                  <Printer className="w-3.5 h-3.5"/> Print
                </button>
              </div>
            </div>

            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">{causesTitle}</p>
              <div className="flex flex-wrap gap-2">
                {getCauses().map((c,i) => <span key={i} className="text-xs px-2.5 py-1 bg-amber-200 text-amber-800 rounded-full font-medium">{c}</span>)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">✅</span>
                  <div>
                    <h3 className="font-bold text-slate-800">{pathyaTitle}</h3>
                    <p className="text-xs text-slate-400">{lang==="hi" ? "क्या खाएं और अपनाएं" : "Shu Khavun ane Apnavun"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {selected.pathya.map((sec,i) => (
                    <div key={i}>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1.5">{cl(sec.category)}</p>
                      <ul className="space-y-1">
                        {getItems(sec).map((item,j) => (
                          <li key={j} className="text-sm text-slate-700 flex items-start gap-1.5">
                            <span className="text-emerald-400 mt-0.5 shrink-0">•</span>{item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-red-50/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">❌</span>
                  <div>
                    <h3 className="font-bold text-slate-800">{apathyaTitle}</h3>
                    <p className="text-xs text-slate-400">{lang==="hi" ? "क्या न खाएं" : "Shu Na Khavun"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {selected.apathya.map((sec,i) => (
                    <div key={i}>
                      <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1.5">{cl(sec.category)}</p>
                      <ul className="space-y-1">
                        {getItems(sec).map((item,j) => (
                          <li key={j} className="text-sm text-slate-700 flex items-start gap-1.5">
                            <span className="text-red-400 mt-0.5 shrink-0">•</span>{item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
