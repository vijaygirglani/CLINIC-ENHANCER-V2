import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Printer, Search, BookOpen, ChevronDown, ChevronRight, Share2 } from "lucide-react";
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
  group: string;
  nameGu: string;
  nameHi: string;
  nameEn: string;
  causesGu: string[];
  causesHi: string[];
  pathya: DiseaseSection[];
  apathya: DiseaseSection[];
}

const groupLabels: Record<string, { hi: string; gu: string }> = {
  "Digestive Disorders":    { hi: "पाचन रोग",           gu: "પાચન રોગ" },
  "Respiratory Disorders":  { hi: "श्वास रोग",           gu: "શ્વાસ રોગ" },
  "Metabolic Disorders":    { hi: "चयापचय रोग",          gu: "ચયાપચય રોગ" },
  "Joint & Pain Disorders": { hi: "जोड़ व दर्द रोग",    gu: "સાંધા અને દર્દ" },
  "Skin Disorders":         { hi: "त्वचा रोग",           gu: "ત્વચા રોગ" },
  "Women's Health":         { hi: "महिला स्वास्थ्य",     gu: "મહિલા સ્વાસ્થ્ય" },
  "Child Health":           { hi: "बाल स्वास्थ्य",       gu: "બાળ સ્વાસ્થ્ય" },
  "Urinary Disorders":      { hi: "मूत्र रोग",           gu: "મૂત્ર રોગ" },
  "ENT & Head Disorders":   { hi: "ENT व सिर रोग",       gu: "ENT અને માથા" },
  "Liver & Metabolic":      { hi: "यकृत रोग",            gu: "યકૃત રોગ" },
  "Thyroid & Hormonal":     { hi: "थायरॉइड",             gu: "થાઈરોઈડ" },
  "Mental & Lifestyle":     { hi: "मानसिक स्वास्थ्य",   gu: "માનસિક સ્વાસ્થ્ય" },
  "Sexual Health":          { hi: "प्रजनन स्वास्थ्य",   gu: "પ્રજનન સ્વાસ્થ્ય" },
  "Eye Disorders":          { hi: "नेत्र रोग",           gu: "નેત્ર રોગ" },
  "Panchakarma":            { hi: "पंचकर्म पथ्य",        gu: "પંચકર્મ પથ્ય" },
  "Seasonal (Ritucharya)":  { hi: "ऋतुचर्या",            gu: "ઋતુચર્ય" },
  "Geriatric":              { hi: "वृद्धावस्था",          gu: "વૃદ્ધ સ્વાસ્થ્ય" },
};

const GROUP_ORDER = [
  "Digestive Disorders","Respiratory Disorders","Metabolic Disorders","Joint & Pain Disorders",
  "Skin Disorders","Women's Health","Child Health","Urinary Disorders","ENT & Head Disorders",
  "Liver & Metabolic","Thyroid & Hormonal","Mental & Lifestyle","Sexual Health",
  "Eye Disorders","Panchakarma","Seasonal (Ritucharya)","Geriatric",
];

const diseases: Disease[] = [
  {
    id:"amlapitta", group:"Digestive Disorders",
    nameGu:"અમ્લપિત્ત", nameHi:"अम्लपित्त", nameEn:"Amlapitta",
    causesGu:["ખાટો-તીખો ખોરાક","અનિયમિત ભોજન","વધુ ચા/કૉફી","તણાવ","મોડીરાત્રે જમવું"],
    causesHi:["खट्टा-तीखा भोजन","अनियमित भोजन","अधिक चाय/कॉफी","तनाव","देर रात भोजन"],
    pathya:[{
      category:"Food",
      itemsEn:["Bottle gourd","Coconut water","Buttermilk","Fennel water","Old rice","Early dinner"],
      itemsGu:["દુધી","નાળિયેર પાણી","છાશ","વરિયાળીનું પાણી","જૂના ચોખા","વહેલું જમવું"],
      itemsHi:["लौकी","नारियल पानी","छाछ","सौंफ पानी","पुराने चावल","जल्दी भोजन"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Tea / coffee excess","Fried foods","Pickles","Bakery food","Late night meals"],
      itemsGu:["વધુ ચા / કોફી","તળેલું ખાવું","અથાણા","બેકરી વસ્તુઓ","મોડીરાત્રે જમવું"],
      itemsHi:["अधिक चाय / कॉफी","तला भोजन","अचार","बेकरी पदार्थ","देर रात भोजन"],
    }],
  },
  {
    id:"ajirna", group:"Digestive Disorders",
    nameGu:"અજીર્ણ", nameHi:"अजीर्ण", nameEn:"Ajirna",
    causesGu:["વધુ ખાવું","ઝડપથી ખાવું","અનિયમિત ભોજન","જંક ફૂડ"],
    causesHi:["ज्यादा खाना","जल्दी खाना","अनियमित भोजन","जंक फूड"],
    pathya:[{
      category:"Food",
      itemsEn:["Light food","Ginger","Warm water","Moong soup"],
      itemsGu:["હલકો ખોરાક","આદુ","ગરમ પાણી","મગનું સૂપ"],
      itemsHi:["हल्का भोजन","अदरक","गर्म पानी","मूंग सूप"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Heavy meals","Cold drinks","Day sleep","Junk food"],
      itemsGu:["ભારે ભોજન","ઠંડા પીણાં","દિવસની ઊંઘ","જંક ફૂડ"],
      itemsHi:["भारी भोजन","ठंडे पेय","दिन में सोना","जंक फूड"],
    }],
  },
  {
    id:"vibandha", group:"Digestive Disorders",
    nameGu:"કબજિયાત", nameHi:"कब्ज", nameEn:"Vibandha",
    causesGu:["ઓછું પાણી","સૂકો ખોરાક","બેકરી વધુ","કસરત નહીં"],
    causesHi:["कम पानी","सूखा भोजन","बेकरी अधिक","व्यायाम नहीं"],
    pathya:[{
      category:"Food",
      itemsEn:["Warm water","Ghee","Papaya","Green vegetables"],
      itemsGu:["ગરમ પાણી","ઘી","પપૈયું","લીલા શાક"],
      itemsHi:["गर्म पानी","घी","पपीता","हरी सब्जियां"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Dry food","Bakery food","Suppressing urges"],
      itemsGu:["સુકું ખાવું","બેકરી ખોરાક","વેગ રોકવો"],
      itemsHi:["सूखा भोजन","बेकरी भोजन","वेग रोकना"],
    }],
  },
  {
    id:"atisara", group:"Digestive Disorders",
    nameGu:"અતિસાર", nameHi:"अतिसार", nameEn:"Atisara",
    causesGu:["દૂષિત ખોરાક","બહારનું ખાવું","તેલિયું ખોરાક"],
    causesHi:["दूषित भोजन","बाहर का खाना","तेलयुक्त भोजन"],
    pathya:[{
      category:"Food",
      itemsEn:["Rice water","Pomegranate","Moong khichdi","ORS"],
      itemsGu:["ચોખાનું પાણી","દાડમ","મગની ખીચડી","ઓઆરએસ"],
      itemsHi:["चावल का पानी","अनार","मूंग खिचड़ी","ओआरएस"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Oily food","Milk excess","Street food"],
      itemsGu:["તેલિયું ખાવું","વધુ દૂધ","બહારનું ખાવું"],
      itemsHi:["तेलयुक्त भोजन","अधिक दूध","बाहर का भोजन"],
    }],
  },
  {
    id:"grahani", group:"Digestive Disorders",
    nameGu:"ગ્રહણી", nameHi:"ग्रहणी", nameEn:"Grahani",
    causesGu:["અનિયમિત ભોજન","વધુ તીખું","તણાવ"],
    causesHi:["अनियमित भोजन","अधिक तीखा","तनाव"],
    pathya:[{
      category:"Food",
      itemsEn:["Buttermilk","Light meals","Jeera water","Old rice"],
      itemsGu:["છાશ","હલકો ખોરાક","જીરું પાણી","જૂના ચોખા"],
      itemsHi:["छाछ","हल्का भोजन","जीरा पानी","पुराने चावल"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Irregular meals","Fried foods","Excess spicy food"],
      itemsGu:["અનિયમિત ભોજન","તળેલું ખાવું","વધુ તીખું"],
      itemsHi:["अनियमित भोजन","तला भोजन","अधिक तीखा"],
    }],
  },
  {
    id:"adhmana", group:"Digestive Disorders",
    nameGu:"ગેસ / અફરો", nameHi:"गैस / अफारा", nameEn:"Adhmana",
    causesGu:["ગેસ કરતો ખોરાક","ઠંડા પીણાં","ફાસ્ટ ફૂડ"],
    causesHi:["गैस बनाने वाला भोजन","ठंडे पेय","फास्ट फूड"],
    pathya:[{
      category:"Food",
      itemsEn:["Ajwain","Hing","Warm water","Light meals"],
      itemsGu:["અજમો","હિંગ","ગરમ પાણી","હલકો ખોરાક"],
      itemsHi:["अजवाइन","हींग","गर्म पानी","हल्का भोजन"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Beans excess","Cold drinks","Fast food"],
      itemsGu:["વધુ વટાણા","ઠંડા પીણાં","ફાસ્ટ ફૂડ"],
      itemsHi:["अधिक दालें","ठंडे पेय","फास्ट फूड"],
    }],
  },
  {
    id:"arsha", group:"Digestive Disorders",
    nameGu:"અર્શ / બાવાશીર", nameHi:"बवासीर", nameEn:"Arsha",
    causesGu:["કબજિયાત","તીખો ખોરાક","લાંબો સમય બેસવું","ઓછું પાણી"],
    causesHi:["कब्ज","तीखा भोजन","लंबे समय बैठना","कम पानी"],
    pathya:[{
      category:"Food",
      itemsEn:["Fiber-rich diet","Buttermilk","Warm water","Papaya"],
      itemsGu:["ફાઈબરવાળો ખોરાક","છાશ","ગરમ પાણી","પપૈયું"],
      itemsHi:["रेशेदार भोजन","छाछ","गर्म पानी","पपीता"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Constipation","Spicy foods","Sitting long hours"],
      itemsGu:["કબજિયાત","તીખું ખાવું","લાંબા સમય બેસવું"],
      itemsHi:["कब्ज","तीखा भोजन","लंबे समय बैठना"],
    }],
  },
  {
    id:"kasa", group:"Respiratory Disorders",
    nameGu:"ઉધરસ", nameHi:"खांसी", nameEn:"Kasa",
    causesGu:["ઠંડી","ધૂળ/ધુમાડો","ગળાનો ચેપ"],
    causesHi:["ठंड","धूल/धुआं","गले का संक्रमण"],
    pathya:[{
      category:"Food",
      itemsEn:["Ginger","Honey","Turmeric milk","Warm water"],
      itemsGu:["આદુ","મધ","હળદર દૂધ","ગરમ પાણી"],
      itemsHi:["अदरक","शहद","हल्दी दूध","गर्म पानी"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Ice cream","Cold drinks","Dust exposure"],
      itemsGu:["આઈસક્રીમ","ઠંડા પીણાં","ધૂળ"],
      itemsHi:["आइसक्रीम","ठंडे पेय","धूल"],
    }],
  },
  {
    id:"pratishyaya", group:"Respiratory Disorders",
    nameGu:"શરદી", nameHi:"जुकाम", nameEn:"Pratishyaya",
    causesGu:["ઠંડી","ઋતુ-ફેર","આઈસક્રીમ વધુ"],
    causesHi:["ठंड","मौसम परिवर्तन","आइसक्रीम अधिक"],
    pathya:[{
      category:"Food",
      itemsEn:["Tulsi tea","Steam inhalation","Warm water"],
      itemsGu:["તુલસી ચા","વરાળ","ગરમ પાણી"],
      itemsHi:["तुलसी चाय","भाप","गर्म पानी"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Cold foods","Ice cream","Night awakening"],
      itemsGu:["ઠંડું ખાવું","આઈસક્રીમ","મોડે સુધી જાગવું"],
      itemsHi:["ठंडा भोजन","आइसक्रीम","देर रात जागना"],
    }],
  },
  {
    id:"shwasa", group:"Respiratory Disorders",
    nameGu:"શ્વાસ / દમ", nameHi:"दमा", nameEn:"Shwasa",
    causesGu:["ધૂળ","ઠંડો ખોરાક","ધૂમ્રપાન","એલર્જન"],
    causesHi:["धूल","ठंडा भोजन","धूम्रपान","एलर्जन"],
    pathya:[{
      category:"Food",
      itemsEn:["Warm water","Ginger","Light meals","Breathing exercises"],
      itemsGu:["ગરમ પાણી","આદુ","હલકો ખોરાક","પ્રાણાયામ"],
      itemsHi:["गर्म पानी","अदरक","हल्का भोजन","प्राणायाम"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Dust","Cold foods","Smoking"],
      itemsGu:["ધૂળ","ઠંડું ખાવું","ધૂમ્રપાન"],
      itemsHi:["धूल","ठंडा भोजन","धूम्रपान"],
    }],
  },
  {
    id:"madhumeha", group:"Metabolic Disorders",
    nameGu:"મધુમેહ", nameHi:"मधुमेह", nameEn:"Madhumeha",
    causesGu:["વધુ ખાંડ","કસરત નહીં","દિવસ ઊંઘ","વારસાગત"],
    causesHi:["अधिक चीनी","व्यायाम नहीं","दिन में सोना","वंशानुगत"],
    pathya:[{
      category:"Food",
      itemsEn:["Barley","Fenugreek","Bitter gourd","Walking"],
      itemsGu:["જવ","મેથી","કારેલા","ચાલવું"],
      itemsHi:["जौ","मेथी","करेला","चलना"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Sugar","Sweets","Cold drinks","Day sleep"],
      itemsGu:["ખાંડ","મીઠાઈ","કોલ્ડ ડ્રિન્ક્સ","દિવસની ઊંઘ"],
      itemsHi:["चीनी","मिठाई","कोल्ड ड्रिंक्स","दिन में सोना"],
    }],
  },
  {
    id:"sthoulya", group:"Metabolic Disorders",
    nameGu:"સ્થૌલ્ય / મોટાપો", nameHi:"मोटापा", nameEn:"Sthoulya",
    causesGu:["તળેલું-મીઠાઈ વધુ","કસરત નહીં","દિવસ ઊંઘ","વધુ ખાવું"],
    causesHi:["तला-मिठाई अधिक","व्यायाम नहीं","दिन में सोना","अधिक खाना"],
    pathya:[{
      category:"Food",
      itemsEn:["Barley","Honey water","Exercise","Green vegetables"],
      itemsGu:["જવ","મધ પાણી","કસરત","લીલા શાક"],
      itemsHi:["जौ","शहद पानी","व्यायाम","हरी सब्जियां"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Fried foods","Sweets","Day sleep"],
      itemsGu:["તળેલું ખાવું","મીઠાઈ","દિવસની ઊંઘ"],
      itemsHi:["तला भोजन","मिठाई","दिन में सोना"],
    }],
  },
  {
    id:"hypertension", group:"Metabolic Disorders",
    nameGu:"હાઈ બ્લડ પ્રેશર", nameHi:"उच्च रक्तचाप", nameEn:"Hypertension",
    causesGu:["વધુ મીઠું","તણાવ","ધૂમ્રપાન","તળેલો ખોરાક"],
    causesHi:["अधिक नमक","तनाव","धूम्रपान","तला भोजन"],
    pathya:[{
      category:"Food",
      itemsEn:["Low salt diet","Meditation","Walking","Fruits"],
      itemsGu:["ઓછું મીઠું","ધ્યાન","ચાલવું","ફળ"],
      itemsHi:["कम नमक","ध्यान","चलना","फल"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Stress","Excess salt","Smoking"],
      itemsGu:["તણાવ","વધુ મીઠું","ધૂમ્રપાન"],
      itemsHi:["तनाव","अधिक नमक","धूम्रपान"],
    }],
  },
  {
    id:"sandhivata", group:"Joint & Pain Disorders",
    nameGu:"સાંધિવાત", nameHi:"संधिवात", nameEn:"Sandhivata",
    causesGu:["ઠંડી","ઠંડું પાણી","ઉંમર","વાત અસંતુલન"],
    causesHi:["ठंड","ठंडा पानी","उम्र","वात असंतुलन"],
    pathya:[{
      category:"Food",
      itemsEn:["Sesame oil massage","Warm food","Methi","Gentle exercise"],
      itemsGu:["તિલ તેલ મસાજ","ગરમ ખોરાક","મેથી","હળવી કસરત"],
      itemsHi:["तिल तेल मालिश","गर्म भोजन","मेथी","हल्का व्यायाम"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Cold water","Curd at night","Excess walking"],
      itemsGu:["ઠંડું પાણી","રાત્રે દહીં","વધુ ચાલવું"],
      itemsHi:["ठंडा पानी","रात में दही","अधिक चलना"],
    }],
  },
  {
    id:"amavata", group:"Joint & Pain Disorders",
    nameGu:"આમવાત", nameHi:"आमवात", nameEn:"Amavata",
    causesGu:["વધુ દહીં","ભારે ભોજન","દિવસ ઊંઘ","ઠંડું-ભેજ"],
    causesHi:["अधिक दही","भारी भोजन","दिन में सोना","ठंडी-नमी"],
    pathya:[{
      category:"Food",
      itemsEn:["Dry ginger","Warm water","Light meals","Castor oil (under supervision)"],
      itemsGu:["સૂંઠ","ગરમ પાણી","હલકો ખોરાક","એરંડ તેલ"],
      itemsHi:["सोंठ","गर्म पानी","हल्का भोजन","एरंड तेल"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Curd","Heavy meals","Day sleep"],
      itemsGu:["દહીં","ભારે ભોજન","દિવસની ઊંઘ"],
      itemsHi:["दही","भारी भोजन","दिन में सोना"],
    }],
  },
  {
    id:"katishoola", group:"Joint & Pain Disorders",
    nameGu:"કમર દુખાવો", nameHi:"कमर दर्द", nameEn:"Katishoola",
    causesGu:["ભારે વજન","લાંબો સમય બેસવું","ઠંડી","ખોટી મુદ્રા"],
    causesHi:["भारी वजन","लंबे समय बैठना","ठंड","गलत मुद्रा"],
    pathya:[{
      category:"Food",
      itemsEn:["Oil massage","Proper rest","Yoga","Warm food"],
      itemsGu:["તેલ મસાજ","આરામ","યોગ","ગરમ ખોરાક"],
      itemsHi:["तेल मालिश","आराम","योग","गर्म भोजन"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Heavy lifting","Cold exposure","Long sitting"],
      itemsGu:["ભારે વજન","ઠંડી","લાંબો સમય બેસવું"],
      itemsHi:["भारी वजन","ठंड","लंबे समय बैठना"],
    }],
  },
  {
    id:"dadru", group:"Skin Disorders",
    nameGu:"દાદ", nameHi:"दाद", nameEn:"Dadru",
    causesGu:["વધુ પસેવો","ભેજવાળું વાતાવરણ","તળેલો ખોરાક","ઓછી રોગ-પ્રતિકારક શક્તિ"],
    causesHi:["अधिक पसीना","नमी वाला वातावरण","तेलयुक्त भोजन","कम रोग प्रतिरोधक क्षमता"],
    pathya:[{
      category:"Food",
      itemsEn:["Neem","Turmeric","Light diet","Keep skin dry"],
      itemsGu:["લીમડો","હળદર","હલકો ખોરાક","ત્વચા સુકી રાખવી"],
      itemsHi:["नीम","हल्दी","हल्का भोजन","त्वचा सूखी रखें"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Excess sweets","Oily food","Sweating without cleaning"],
      itemsGu:["વધુ મીઠાઈ","તેલિયું ખાવું","પરસેવો રહી જવો"],
      itemsHi:["अधिक मिठाई","तेलयुक्त भोजन","पसीना साफ ન करना"],
    }],
  },
  {
    id:"vicharchika", group:"Skin Disorders",
    nameGu:"વિચર્ચિકા", nameHi:"विचर्चिका", nameEn:"Vicharchika",
    causesGu:["વધુ દહીં","દૂધ સાથે માછલી","તણાવ","કેમિકલ સાબુ"],
    causesHi:["अधिक दही","दूध के साथ मछली","तनाव","रासायनिक साबुन"],
    pathya:[{
      category:"Food",
      itemsEn:["Bitter vegetables","Neem","Old grains","Adequate hydration"],
      itemsGu:["તીખા શાક","લીમડો","જૂના અનાજ","પૂરતું પાણી"],
      itemsHi:["कड़वी सब्जियां","नीम","पुराने अनाज","पर्याप्त पानी"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Curd","Fish with milk","Junk food"],
      itemsGu:["દહીં","દૂધ સાથે માછલી","જંક ફૂડ"],
      itemsHi:["दही","दूध के साथ मछली","जंक फूड"],
    }],
  },
  {
    id:"kitibha", group:"Skin Disorders",
    nameGu:"સોરાયસિસ", nameHi:"सोरायसिस", nameEn:"Kitibha",
    causesGu:["તણાવ","દારૂ","ખોટી ખોરાક જોડ","વારસાગત"],
    causesHi:["तनाव","शराब","गलत भोजन संयोग","वंशानुगत"],
    pathya:[{
      category:"Food",
      itemsEn:["Neem","Bitter gourd","Triphala","Meditation"],
      itemsGu:["લીમડો","કારેલા","ત્રિફળા","ધ્યાન"],
      itemsHi:["नीम","करेला","त्रिफला","ध्यान"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Non-veg excess","Alcohol","Stress"],
      itemsGu:["વધુ માંસાહાર","દારૂ","તણાવ"],
      itemsHi:["अधिक मांसाहार","शराब","तनाव"],
    }],
  },
  {
    id:"yauvana-pidika", group:"Skin Disorders",
    nameGu:"ખીલ", nameHi:"मुंहासे", nameEn:"Yauvana Pidika",
    causesGu:["હૉર્મોન અસંતુલન","તળેલો ખોરાક","મોડે જાગવું","કબજિયાત"],
    causesHi:["हार्मोन असंतुलन","तेलयुक्त भोजन","देर से सोना","कब्ज"],
    pathya:[{
      category:"Food",
      itemsEn:["Fruits","Green vegetables","Neem","Adequate sleep"],
      itemsGu:["ફળ","લીલા શાક","લીમડો","પૂરતી ઊંઘ"],
      itemsHi:["फल","हरी सब्जियां","नीम","पर्याप्त नींद"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Fried foods","Chocolate excess","Late nights"],
      itemsGu:["તળેલું","વધુ ચોકલેટ","મોડે સુધી જાગવું"],
      itemsHi:["तला भोजन","अधिक चॉकलेट","देर रात जागना"],
    }],
  },
  {
    id:"sheetapitta", group:"Skin Disorders",
    nameGu:"શીતપિત્ત", nameHi:"शीतपित्त", nameEn:"Sheetapitta",
    causesGu:["એલર્જી ખોરાક","વધુ તીખું","ઠંડી","સમુદ્રી ખોરાક"],
    causesHi:["एलर्जिक भोजन","अधिक तीखा","ठंड","समुद्री भोजन"],
    pathya:[{
      category:"Food",
      itemsEn:["Coriander water","Ghee","Cooling diet"],
      itemsGu:["ધાણા પાણી","ઘી","ઠંડકવાળો ખોરાક"],
      itemsHi:["धनिया पानी","घी","शीतल आहार"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Seafood","Fermented food","Excess spicy food"],
      itemsGu:["સમુદ્રી ખોરાક","ખાટું ખાવું","વધુ તીખું"],
      itemsHi:["समुद्री भोजन","खट्टा भोजन","अधिक तीखा"],
    }],
  },
  {
    id:"khalitya", group:"Skin Disorders",
    nameGu:"વાળ ખરવા", nameHi:"बाल झड़ना", nameEn:"Khalitya",
    causesGu:["તણાવ","પોષણ ખામી","જંક ફૂડ","ઓછી ઊંઘ"],
    causesHi:["तनाव","पोषण की कमी","जंक फूड","कम नींद"],
    pathya:[{
      category:"Food",
      itemsEn:["Amla","Sesame","Milk","Stress reduction"],
      itemsGu:["આમળા","તલ","દૂધ","તણાવ ઓછો"],
      itemsHi:["आंवला","तिल","दूध","तनाव कम"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Stress","Junk food","Sleep deprivation"],
      itemsGu:["તણાવ","જંક ફૂડ","ઓછી ઊંઘ"],
      itemsHi:["तनाव","जंक फूड","कम नींद"],
    }],
  },
  {
    id:"kashtartava", group:"Women's Health",
    nameGu:"માસિક દુખાવો", nameHi:"मासिक दर्द", nameEn:"Kashtartava",
    causesGu:["વાત અસંતુલન","ઠંડો ખોરાક","તણાવ","કસરત નહીં"],
    causesHi:["वात असंतुलन","ठंडा भोजन अधिक","तनाव","व्यायाम नहीं"],
    pathya:[{
      category:"Food",
      itemsEn:["Warm water","Ajwain","Rest","Light food"],
      itemsGu:["ગરમ પાણી","અજમો","આરામ","હલકો ખોરાક"],
      itemsHi:["गर्म पानी","अजवाइन","आराम","हल्का भोजन"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Cold foods","Stress","Excess exercise"],
      itemsGu:["ઠંડું ખાવું","તણાવ","વધુ કસરત"],
      itemsHi:["ठंडा भोजन","तनाव","अधिक व्यायाम"],
    }],
  },
  {
    id:"pcod", group:"Women's Health",
    nameGu:"પીસીઓડી", nameHi:"पीसीओडी", nameEn:"Pcod / Pcos",
    causesGu:["હૉર્મોન અસંતુલન","જંક ફૂડ","કસરત નહીં","તણાવ"],
    causesHi:["हार्मोन असंतुलन","जंक फूड","व्यायाम नहीं","तनाव"],
    pathya:[{
      category:"Food",
      itemsEn:["Weight control","Exercise","Barley","Green vegetables"],
      itemsGu:["વજન નિયંત્રણ","કસરત","જવ","લીલા શાક"],
      itemsHi:["वजन नियंत्रण","व्यायाम","जौ","हरी सब्जियां"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Junk food","Sugar excess","Sedentary lifestyle"],
      itemsGu:["જંક ફૂડ","વધુ ખાંડ","કસરતનો અભાવ"],
      itemsHi:["जंक फूड","अधिक चीनी","व्यायाम की कमी"],
    }],
  },
  {
    id:"shweta-pradara", group:"Women's Health",
    nameGu:"સફેદ પાણી", nameHi:"श्वेत प्रदर", nameEn:"Shweta Pradara",
    causesGu:["અસ્વચ્છતા","વધુ તીખું","હૉર્મોન અસંતુલન"],
    causesHi:["अस्वच्छता","अधिक तीखा","हार्मोन असंतुलन"],
    pathya:[{
      category:"Food",
      itemsEn:["Pomegranate","Rice","Buttermilk","Proper hygiene"],
      itemsGu:["દાડમ","ચોખા","છાશ","સ્વચ્છતા"],
      itemsHi:["अनार","चावल","छाछ","स्वच्छता"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Excess spicy food","Poor hygiene"],
      itemsGu:["વધુ તીખું","અસ્વચ્છતા"],
      itemsHi:["अधिक तीखा","अस्वच्छता"],
    }],
  },
  {
    id:"bal-shardi", group:"Child Health",
    nameGu:"બાળકોમાં વારંવાર શરદી", nameHi:"बच्चों में बार-बार जुकाम", nameEn:"Recurrent Cold In Children",
    causesGu:["ઓછી રોગ-પ્રતિકારક શક્તિ","ઠંડા પીણાં વધુ","ધૂળ"],
    causesHi:["कम रोग प्रतिरोध","ठंडे पेय अधिक","धूल"],
    pathya:[{
      category:"Food",
      itemsEn:["Suvarnaprashan","Warm water","Tulsi","Nutritious food"],
      itemsGu:["સુવર્ણપ્રાશન","ગરમ પાણી","તુલસી","પૌષ્ટિક આહાર"],
      itemsHi:["सुवर्णप्राशन","गर्म पानी","तुलसी","पौष्टिक आहार"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Ice cream","Cold drinks","Dust exposure"],
      itemsGu:["આઈસક્રીમ","ઠંડા પીણાં","ધૂળ"],
      itemsHi:["आइसक्रीम","ठंडे पेय","धूल"],
    }],
  },
  {
    id:"mutrakriccha", group:"Urinary Disorders",
    nameGu:"મૂત્રમાં દાઝ", nameHi:"पेशाब में जलन", nameEn:"Mutrakriccha",
    causesGu:["ઓછું પાણી","વધુ તીખું","મૂત્ર ચેપ"],
    causesHi:["कम पानी","अधिक तीखा","मूत्र संक्रमण"],
    pathya:[{
      category:"Food",
      itemsEn:["Coconut water","Coriander water","Plenty of fluids"],
      itemsGu:["નાળિયેર પાણી","ધાણા પાણી","પૂરતું પાણી"],
      itemsHi:["नारियल पानी","धनिया पानी","पर्याप्त पानी"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Spicy food","Dehydration"],
      itemsGu:["તીખું ખાવું","પાણી ઓછું પીવું"],
      itemsHi:["तीखा भोजन","कम पानी"],
    }],
  },
  {
    id:"ashmari", group:"Urinary Disorders",
    nameGu:"પથરી", nameHi:"पथरी", nameEn:"Ashmari",
    causesGu:["ઓછું પાણી","વધુ મીઠું","ઑક્સલેટ ખોરાક"],
    causesHi:["कम पानी","अधिक नमक","ऑक्सलेट युक्त भोजन"],
    pathya:[{
      category:"Food",
      itemsEn:["Coconut water","Barley water","Lemon water"],
      itemsGu:["નાળિયેર પાણી","જવનું પાણી","લીંબુ પાણી"],
      itemsHi:["नारियल पानी","जौ पानी","नींबू पानी"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Dehydration","Excess salt","Junk food"],
      itemsGu:["પાણી ઓછું પીવું","વધુ મીઠું","જંક ફૂડ"],
      itemsHi:["कम पानी","अधिक नमक","जंक फूड"],
    }],
  },
  {
    id:"migraine", group:"ENT & Head Disorders",
    nameGu:"આધાશીશી", nameHi:"माइग्रेन", nameEn:"Migraine",
    causesGu:["તણાવ","ઉપવાસ","વધુ મોબાઈલ","અનિયમિત ઊંઘ"],
    causesHi:["तनाव","उपवास","अधिक मोबाइल","अनियमित नींद"],
    pathya:[{
      category:"Food",
      itemsEn:["Adequate sleep","Meditation","Cow ghee","Stress reduction"],
      itemsGu:["પૂરતી ઊંઘ","ધ્યાન","ગાયનું ઘી","તણાવ ઓછો"],
      itemsHi:["पर्याप्त नींद","ध्यान","गाय का घी","तनाव कम"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Stress","Fasting","Excess screen time"],
      itemsGu:["તણાવ","ઉપવાસ","વધુ મોબાઈલ"],
      itemsHi:["तनाव","उपवास","अधिक मोबाइल"],
    }],
  },
  {
    id:"mukha-paka", group:"ENT & Head Disorders",
    nameGu:"મોઢાના છાલા", nameHi:"मुंह के छाले", nameEn:"Mouth Ulcers",
    causesGu:["વધુ તીખું","વિટામિન ખામી","તણાવ","તમાકુ"],
    causesHi:["अधिक तीखा","विटामिन की कमी","तनाव","तंबाकू"],
    pathya:[{
      category:"Food",
      itemsEn:["Ghee","Coconut water","Soft food"],
      itemsGu:["ઘી","નાળિયેર પાણી","નરમ ખોરાક"],
      itemsHi:["घी","नारियल पानी","नरम भोजन"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Spicy food","Tobacco","Hot food"],
      itemsGu:["તીખું ખાવું","તમાકુ","ગરમ ખોરાક"],
      itemsHi:["तीखा भोजन","तंबाकू","गरम भोजन"],
    }],
  },
  {
    id:"sinusitis", group:"ENT & Head Disorders",
    nameGu:"સાઈનસ", nameHi:"साइनस", nameEn:"Sinusitis",
    causesGu:["ઠંડી","ધૂળ એલર્જી","પ્રદૂષણ","કફ અસંતુલન"],
    causesHi:["ठंड","धूल एलर्जी","प्रदूषण","कफ असंतुलन"],
    pathya:[{
      category:"Food",
      itemsEn:["Steam inhalation","Warm water","Nasya"],
      itemsGu:["વરાળ","ગરમ પાણી","નસ્ય"],
      itemsHi:["भाप","गर्म पानी","नस्य"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Cold exposure","Ice cream","Dust"],
      itemsGu:["ઠંડી","આઈસક્રીમ","ધૂળ"],
      itemsHi:["ठंड","आइसक्रीम","धूल"],
    }],
  },
  {
    id:"fatty-liver", group:"Liver & Metabolic",
    nameGu:"ફેટી લીવર", nameHi:"फैटी लिवर", nameEn:"Fatty Liver",
    causesGu:["દારૂ","તળેલું-ખાંડ વધુ","સ્થૂળતા","કસરત નહીં"],
    causesHi:["शराब","तला-चीनी अधिक","मोटापा","व्यायाम नहीं"],
    pathya:[{
      category:"Food",
      itemsEn:["Barley","Green vegetables","Bitter gourd","Walking","Warm water"],
      itemsGu:["જવ","લીલા શાક","કારેલા","ચાલવું","ગરમ પાણી"],
      itemsHi:["जौ","हरी सब्जियां","करेला","चलना","गर्म पानी"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Alcohol","Fried foods","Sugar excess","Day sleep"],
      itemsGu:["દારૂ","તળેલું ખાવું","વધુ ખાંડ","દિવસની ઊંઘ"],
      itemsHi:["शराब","तला भोजन","अधिक चीनी","दिन में सोना"],
    }],
  },
  {
    id:"kamala", group:"Liver & Metabolic",
    nameGu:"કામળો", nameHi:"पीलिया", nameEn:"Kamala",
    causesGu:["યકૃત ચેપ","દૂષિત પાણી","દારૂ","ભારે ભોજન"],
    causesHi:["यकृत संक्रमण","दूषित पानी","शराब","भारी भोजन"],
    pathya:[{
      category:"Food",
      itemsEn:["Sugarcane juice","Coconut water","Moong soup","Rest"],
      itemsGu:["શેરડીનો રસ","નાળિયેર પાણી","મગનું સૂપ","આરામ"],
      itemsHi:["गन्ने का रस","नारियल पानी","मूंग सूप","आराम"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Oily food","Alcohol","Heavy meals"],
      itemsGu:["તેલિયું ખાવું","દારૂ","ભારે ભોજન"],
      itemsHi:["तेलयुक्त भोजन","शराब","भारी भोजन"],
    }],
  },
  {
    id:"pandu", group:"Liver & Metabolic",
    nameGu:"પાંડુ / લોહીની ઉણપ", nameHi:"पांडु / खून की कमी", nameEn:"Pandu",
    causesGu:["આયર્ન ખામી","વધુ ઉપવાસ","જંક ફૂડ","અપચો"],
    causesHi:["आयरन की कमी","अधिक उपवास","जंक फूड","कुअवशोषण"],
    pathya:[{
      category:"Food",
      itemsEn:["Pomegranate","Dates","Beetroot","Amla"],
      itemsGu:["દાડમ","ખજૂર","બીટ","આમળા"],
      itemsHi:["अनार","खजूर","चुकंदर","आंवला"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Junk food","Excess fasting"],
      itemsGu:["જંક ફૂડ","વધુ ઉપવાસ"],
      itemsHi:["जंक फूड","अधिक उपवास"],
    }],
  },
  {
    id:"hypothyroidism", group:"Thyroid & Hormonal",
    nameGu:"થાયરોઇડ ઓછું કાર્ય", nameHi:"हाइपोथायरॉइड", nameEn:"Hypothyroidism",
    causesGu:["કફ અસંતુલન","કસરત નહીં","આયોડિન ખામી","તણાવ"],
    causesHi:["कफ असंतुलन","व्यायाम न करना","आयोडीन की कमी","तनाव"],
    pathya:[{
      category:"Food",
      itemsEn:["Exercise","Warm water","Light meals","Millets"],
      itemsGu:["કસરત","ગરમ પાણી","હલકો ખોરાક","મિલેટ્સ"],
      itemsHi:["व्यायाम","गर्म पानी","हल्का भोजन","मिलेट्स"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Day sleep","Heavy meals","Sedentary lifestyle"],
      itemsGu:["દિવસની ઊંઘ","ભારે ભોજન","કસરતનો અભાવ"],
      itemsHi:["दिन में सोना","भारी भोजन","व्यायाम की कमी"],
    }],
  },
  {
    id:"nidranasha", group:"Mental & Lifestyle",
    nameGu:"નિંદ્રાનાશ", nameHi:"अनिद्रा", nameEn:"Nidranasha",
    causesGu:["તણાવ","વધુ મોબાઈલ","રાત્રે ચા-કૉફી","વાત અસંતુલન"],
    causesHi:["तनाव","अधिक मोबाइल","रात में चाय-कॉफी","वात असंतुलन"],
    pathya:[{
      category:"Food",
      itemsEn:["Warm milk","Meditation","Oil massage","Early sleep"],
      itemsGu:["ગરમ દૂધ","ધ્યાન","તેલ મસાજ","વહેલી ઊંઘ"],
      itemsHi:["गर्म दूध","ध्यान","तेल मालिश","जल्दी सोना"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Excess mobile use","Tea-coffee at night","Stress"],
      itemsGu:["વધુ મોબાઈલ","રાત્રે ચા-કોફી","તણાવ"],
      itemsHi:["अधिक मोबाइल","रात में चाय-कॉफी","तनाव"],
    }],
  },
  {
    id:"chinta", group:"Mental & Lifestyle",
    nameGu:"ચિંતા", nameHi:"चिंता", nameEn:"Chinta",
    causesGu:["વધુ વિચાર","ઓછી ઊંઘ","તણાવ"],
    causesHi:["अधिक सोचना","कम नींद","तनाव"],
    pathya:[{
      category:"Food",
      itemsEn:["Meditation","Brahmi","Pranayama","Proper sleep"],
      itemsGu:["ધ્યાન","બ્રાહ્મી","પ્રાણાયામ","પૂરતી ઊંઘ"],
      itemsHi:["ध्यान","ब्राह्मी","प्राणायाम","पर्याप्त नींद"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Overthinking","Sleep deprivation","Stress"],
      itemsGu:["વધુ વિચાર","ઓછી ઊંઘ","તણાવ"],
      itemsHi:["अधिक सोचना","कम नींद","तनाव"],
    }],
  },
  {
    id:"depression", group:"Mental & Lifestyle",
    nameGu:"ઉદાસીનતા", nameHi:"अवसाद", nameEn:"Depression Supportive Care",
    causesGu:["એકલતા","દારૂ","અનિયમિત દિનચર્યા","દુઃખ"],
    causesHi:["अकेलापन","शराब","अनियमित दिनचर्या","दुःख"],
    pathya:[{
      category:"Food",
      itemsEn:["Counseling","Yoga","Meditation","Nutritious food"],
      itemsGu:["કાઉન્સેલિંગ","યોગ","ધ્યાન","પૌષ્ટિક આહાર"],
      itemsHi:["काउंसलिंग","योग","ध्यान","पौष्टिक आहार"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Isolation","Alcohol","Irregular routine"],
      itemsGu:["એકલતા","દારૂ","અનિયમિત જીવનશૈલી"],
      itemsHi:["अकेलापन","शराब","अनियमित दिनचर्या"],
    }],
  },
  {
    id:"shukra-kshaya", group:"Sexual Health",
    nameGu:"શુક્ર ક્ષય", nameHi:"शुक्र क्षय", nameEn:"Shukra Kshaya",
    causesGu:["તણાવ","વધુ સંભોગ","મોડે સુધી જાગવું"],
    causesHi:["तनाव","अधिक संभोग","देर रात जागना"],
    pathya:[{
      category:"Food",
      itemsEn:["Milk","Ghee","Almonds","Ashwagandha"],
      itemsGu:["દૂધ","ઘી","બદામ","અશ્વગંધા"],
      itemsHi:["दूध","घी","बादाम","अश्वगंधा"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Stress","Excess sexual activity","Night awakening"],
      itemsGu:["તણાવ","વધુ સંભોગ","મોડે સુધી જાગવું"],
      itemsHi:["तनाव","अधिक संभोग","देर रात जागना"],
    }],
  },
  {
    id:"erectile-dysfunction", group:"Sexual Health",
    nameGu:"નપુંસકતા", nameHi:"नपुंसकता", nameEn:"Erectile Dysfunction",
    causesGu:["તણાવ","દારૂ","ધૂમ્રપાન","મધુમેહ"],
    causesHi:["तनाव","शराब","धूम्रपान","मधुमेह"],
    pathya:[{
      category:"Food",
      itemsEn:["Ashwagandha","Milk","Ghee","Healthy sleep"],
      itemsGu:["અશ્વગંધા","દૂધ","ઘી","સારી ઊંઘ"],
      itemsHi:["अश्वगंधा","दूध","घी","अच्छी नींद"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Smoking","Alcohol","Stress"],
      itemsGu:["ધૂમ્રપાન","દારૂ","તણાવ"],
      itemsHi:["धूम्रपान","शराब","तनाव"],
    }],
  },
  {
    id:"eye-strain", group:"Eye Disorders",
    nameGu:"આંખનો થાક", nameHi:"आंखों की थकान", nameEn:"Eye Strain",
    causesGu:["વધુ મોબાઈલ/સ્ક્રીન","રાત્રે જાગવું","વિટામિન A ખામી"],
    causesHi:["अधिक मोबाइल/स्क्रीन","रात जागना","विटामिन A की कमी"],
    pathya:[{
      category:"Food",
      itemsEn:["Triphala wash","Proper sleep","Eye exercises"],
      itemsGu:["ત્રિફળા ધોવાણ","પૂરતી ઊંઘ","આંખ કસરત"],
      itemsHi:["त्रिफला धुलाई","पर्याप्त नींद","आंख व्यायाम"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Excess screen time","Night awakening"],
      itemsGu:["વધુ મોબાઈલ","મોડીરાત્રે જાગવું"],
      itemsHi:["अधिक मोबाइल","देर रात जागना"],
    }],
  },
  {
    id:"conjunctivitis", group:"Eye Disorders",
    nameGu:"આંખ આવવી", nameHi:"आंख आना", nameEn:"Conjunctivitis",
    causesGu:["આંખ ચેપ","ધૂળ","આંખ ઘસવી"],
    causesHi:["आंख संक्रमण","धूल","आंख रगड़ना"],
    pathya:[{
      category:"Food",
      itemsEn:["Eye hygiene","Cold compress","Rest"],
      itemsGu:["આંખ સ્વચ્છતા","ઠંડી પટ્ટી","આરામ"],
      itemsHi:["आंख की सफाई","ठंडी पट्टी","आराम"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Dust exposure","Eye rubbing"],
      itemsGu:["ધૂળ","આંખ ઘસવી"],
      itemsHi:["धूल","आंख मलना"],
    }],
  },
  {
    id:"vamana-pathya", group:"Panchakarma",
    nameGu:"", nameHi:"", nameEn:"Vamana Pathya",
    causesGu:["પંચકર્મ બાદ","કફ ડિટૉક્સ"],
    causesHi:["पंचकर्म के बाद","कफ डेटॉक्स"],
    pathya:[{
      category:"Food",
      itemsEn:[],
      itemsGu:[],
      itemsHi:[],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Heavy food","Fried food","Cold water"],
      itemsGu:["ભારે ભોજન","તળેલું","ઠંડું પાણી"],
      itemsHi:["भारी भोजन","तला भोजन","ठंडा पानी"],
    }],
  },
  {
    id:"summer-ritucharya", group:"Seasonal (Ritucharya)",
    nameGu:"ઉનાળુ ઋતુચર્ય", nameHi:"ग्रीष्म ऋतुचर्या", nameEn:"Summer Ritucharya",
    causesGu:["ઉનાળામાં પિત્ત વધે","ડિહાઇડ્રેશન","વધુ તડકો"],
    causesHi:["गर्मी में पित्त वृद्धि","निर्जलीकरण","अधिक धूप"],
    pathya:[{
      category:"Food",
      itemsEn:["Coconut water","Buttermilk","Watermelon","Light food"],
      itemsGu:["નાળિયેર પાણી","છાશ","તરબૂચ","હલકો ખોરાક"],
      itemsHi:["नारियल पानी","छाछ","तरबूज","हल्का भोजन"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Excess sunlight","Spicy foods","Dehydration"],
      itemsGu:["વધુ તડકો","તીખું ખાવું","પાણી ઓછું પીવું"],
      itemsHi:["अधिक धूप","तीखा भोजन","कम पानी"],
    }],
  },
  {
    id:"winter-ritucharya", group:"Seasonal (Ritucharya)",
    nameGu:"શિયાળુ ઋતુચર્ય", nameHi:"शीत ऋतुचर्या", nameEn:"Winter Ritucharya",
    causesGu:["શિયાળામાં વાત વધે","સૂકી ઠંડી હવા","પાચન ઘટે"],
    causesHi:["सर्दी में वात वृद्धि","सूखी ठंडी हवा","पाचन शक्ति कम"],
    pathya:[{
      category:"Food",
      itemsEn:["Ghee","Sesame","Warm food","Exercise"],
      itemsGu:["ઘી","તલ","ગરમ ખોરાક","કસરત"],
      itemsHi:["घी","तिल","गर्म भोजन","व्यायाम"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Cold exposure","Fasting excess"],
      itemsGu:["ઠંડી","વધુ ઉપવાસ"],
      itemsHi:["ठंड","अधिक उपवास"],
    }],
  },
  {
    id:"memory-weakness", group:"Geriatric",
    nameGu:"યાદશક્તિ ઓછી", nameHi:"याददाश्त कमजोर", nameEn:"Memory Weakness",
    causesGu:["તણાવ","ઓછી ઊંઘ","વધુ મોબાઈલ","વાત અસંતુલન"],
    causesHi:["तनाव","कम नींद","अधिक मोबाइल","वात असंतुलन"],
    pathya:[{
      category:"Food",
      itemsEn:["Brahmi","Almonds","Meditation","Proper sleep"],
      itemsGu:["બ્રાહ્મી","બદામ","ધ્યાન","પૂરતી ઊંઘ"],
      itemsHi:["ब्राह्मी","बादाम","ध्यान","पर्याप्त नींद"],
    }],
    apathya:[{
      category:"Food",
      itemsEn:["Stress","Sleep deprivation","Excess screen time"],
      itemsGu:["તણાવ","ઓછી ઊંઘ","વધુ મોબાઈલ"],
      itemsHi:["तनाव","कम नींद","अधिक मोबाइल"],
    }],
  },
];

function printPathya() {
  const el = document.getElementById("print-pathya");
  if (!el) return;
  el.style.display = "block";
  window.print();
  el.style.display = "none";
}

export default function PathyaApathya() {
  const [lang, setLang]               = useState<Lang>("hi");
  const [patientName, setPatientName] = useState("");
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState<Disease>(diseases[0]);
  const [openGroups, setOpenGroups]   = useState<Set<string>>(new Set(["Digestive Disorders"]));

  const toggleGroup = (g: string) => setOpenGroups(prev => {
    const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n;
  });
  const selectDisease = (d: Disease) => {
    setSelected(d);
    setOpenGroups(prev => new Set([...prev, d.group]));
  };

  const gl = (g: string) => lang === "gu" ? (groupLabels[g]?.gu || g) : (groupLabels[g]?.hi || g);
  const getItems = (sec: DiseaseSection) =>
    lang === "gu" ? sec.itemsGu : lang === "hi" ? sec.itemsHi : sec.itemsEn;
  const getCauses = () => lang === "gu" ? selected.causesGu : selected.causesHi;
  const diseaseName = lang === "gu" ? selected.nameGu : selected.nameHi;
  const today = format(new Date(), "dd/MM/yyyy");

  const pathyaTitle  = lang === "gu" ? "પથ્ય — શું ખાવું" : "पथ्य — क्या खाएं";
  const apathyaTitle = lang === "gu" ? "અપથ્ય — શું ન ખાવું" : "अपथ्य — क्या न खाएं";
  const causesTitle  = lang === "gu" ? "કારણ (Nidana)" : "कारण (Nidana)";

  const shareOnWhatsApp = () => {
    const name   = lang === "gu" ? selected.nameGu : selected.nameHi;
    const causes = getCauses().join(", ");
    const pItems = selected.pathya.flatMap(s => getItems(s)).map(i => `  • ${i}`).join("\n");
    const aItems = selected.apathya.flatMap(s => getItems(s)).map(i => `  • ${i}`).join("\n");

    const patientLine = patientName ? `\n👤 *દર્દી / Patient:* ${patientName}` : "";
    const dateLine    = `📅 *તારીખ / Date:* ${today}`;

    const msg = [
      `🏥 *Manglam Skin Care Clinic*`,
      `Dr. Vijay Girglani | B.A.M.S., C.S.D. | Reg. GBI 17318`,
      patientLine,
      dateLine,
      ``,
      `🔖 *${name}* (${selected.nameEn})`,
      ``,
      `⚠️ *${causesTitle}:* ${causes}`,
      ``,
      `✅ *${pathyaTitle}*`,
      pItems,
      ``,
      `❌ *${apathyaTitle}*`,
      aItems,
      ``,
      `_આ માર્ગદર્શન Manglam Clinic, Tankara તરફથી / Guidance from Manglam Clinic, Tankara_`,
    ].filter(l => l !== undefined).join("\n");

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

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
            <th style={{ background:"#d1fae5", padding:"8px", border:"1px solid #a7f3d0", width:"50%" }}>✅ {pathyaTitle}</th>
            <th style={{ background:"#fee2e2", padding:"8px", border:"1px solid #fca5a5", width:"50%" }}>❌ {apathyaTitle}</th>
          </tr></thead>
          <tbody><tr>
            <td style={{ verticalAlign:"top", padding:"10px", border:"1px solid #d1fae5" }}>
              {selected.pathya.map((s,i) => <div key={i} style={{ marginBottom:"8px" }}>{getItems(s).map((item,j) => <div key={j} style={{ fontSize:"12px" }}>• {item}</div>)}</div>)}
            </td>
            <td style={{ verticalAlign:"top", padding:"10px", border:"1px solid #fee2e2" }}>
              {selected.apathya.map((s,i) => <div key={i} style={{ marginBottom:"8px" }}>{getItems(s).map((item,j) => <div key={j} style={{ fontSize:"12px" }}>• {item}</div>)}</div>)}
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
              <button onClick={() => setLang("hi")} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${lang==="hi" ? "bg-amber-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                हि — Hindi
              </button>
              <button onClick={() => setLang("gu")} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${lang==="gu" ? "bg-amber-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                ગુ — Gujarati
              </button>
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
              placeholder={lang === "hi" ? "बीमारी खोजें..." : "રોગ શોધો..."}
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
                      <p className={`text-sm font-bold leading-tight ${selected.id===d.id ? "text-amber-700" : "text-slate-800"}`}>
                        {lang==="gu" ? d.nameGu : d.nameHi}
                      </p>
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
                      {openGroups.has(group)
                        ? <ChevronDown className="w-3.5 h-3.5 text-amber-500"/>
                        : <ChevronRight className="w-3.5 h-3.5 text-amber-500"/>}
                    </button>
                    {openGroups.has(group) && (
                      <div className="divide-y divide-slate-50">
                        {list.map(d => (
                          <button key={d.id} onClick={() => selectDisease(d)}
                            className={`w-full text-left px-5 py-2.5 hover:bg-amber-50/60 transition-colors ${selected.id===d.id ? "bg-amber-50 border-l-4 border-amber-500" : ""}`}>
                            <p className={`text-sm font-semibold leading-tight ${selected.id===d.id ? "text-amber-700" : "text-slate-800"}`}>
                              {lang==="gu" ? d.nameGu : d.nameHi}
                            </p>
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
                <button onClick={shareOnWhatsApp} className="mt-1.5 flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-white text-xs px-3 py-1.5 rounded-lg transition-colors ml-auto font-semibold">
                  <Share2 className="w-3.5 h-3.5"/>
                  WhatsApp
                </button>
              </div>
            </div>

            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">{causesTitle}</p>
              <div className="flex flex-wrap gap-2">
                {getCauses().map((c,i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-amber-200 text-amber-800 rounded-full font-medium">{c}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">✅</span>
                  <div>
                    <h3 className="font-bold text-slate-800">{pathyaTitle}</h3>
                    <p className="text-xs text-slate-400">{lang==="hi" ? "क्या खाएं और अपनाएं" : "શું ખાવું અને અપનાવવું"}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {selected.pathya.flatMap((sec) =>
                    getItems(sec).map((item, j) => (
                      <li key={j} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5 shrink-0 font-bold">•</span>{item}
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="p-5 bg-red-50/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">❌</span>
                  <div>
                    <h3 className="font-bold text-slate-800">{apathyaTitle}</h3>
                    <p className="text-xs text-slate-400">{lang==="hi" ? "क्या न खाएं" : "શું ન ખાવું"}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {selected.apathya.flatMap((sec) =>
                    getItems(sec).map((item, j) => (
                      <li key={j} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-red-400 mt-0.5 shrink-0 font-bold">•</span>{item}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
