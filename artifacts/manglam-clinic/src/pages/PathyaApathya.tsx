import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Printer, Search, BookOpen, ChevronDown, ChevronRight, Share2, User, X } from "lucide-react";
import { format } from "date-fns";

type Lang = "gu" | "hi";

interface Disease {
  id: string;
  group: string;
  nameEn: string;
  nameHi: string;
  nameGu: string;
  causesEn: string[];
  causesHi: string[];
  causesGu: string[];
  pathyaEn: string[];
  pathyaHi: string[];
  pathyaGu: string[];
  apathyaEn: string[];
  apathyaHi: string[];
  apathyaGu: string[];
}

interface PatientRecord {
  id: number;
  name: string;
  mobile: string;
  complaint?: string;
  complaintCode?: string;
  visitDate: string;
  age?: number;
  address?: string;
}

function getPatientRecords(): PatientRecord[] {
  try { return JSON.parse(localStorage.getItem("mc_patients") || "[]"); }
  catch { return []; }
}

function searchPatients(query: string): PatientRecord[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const byMobile = new Map<string, PatientRecord>();
  for (const p of getPatientRecords()) {
    const existing = byMobile.get(p.mobile);
    if (!existing || p.visitDate > existing.visitDate) byMobile.set(p.mobile, p);
  }
  return Array.from(byMobile.values())
    .filter(p => p.name.toLowerCase().includes(q) || p.mobile.includes(q))
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate))
    .slice(0, 8);
}

const diseases: Disease[] = [
  {
    id: "amlapitta",
    group: "Digestive Disorders",
    nameEn: "Amlapitta (Hyperacidity / Acid Reflux)",
    nameHi: "अम्लपित्त (हाइपरएसिडिटी/अपच)",
    nameGu: "અમ્લપિત્ત (હાઇપરએસિડિટી/અપચ)",
    causesEn: ["Excessive consumption of sour, pungent, and spicy foods (e.g., chili, pickles, vinegar, sour curd).", "Irregular eating habits, skipping meals, or eating very late at night.", "Excessive intake of fermented foods (e.g., idli, dosa, bread), alcohol, tea, and coffee.", "Mental stress, anger, anxiety, and excessive competition (Pitta aggravating factors).", "Suppression of natural urges like hunger, thirst, urination, or defecation.", "Eating incompatible food combinations (Viruddha Ahara)."],
    causesHi: ["अत्यधिक खट्टे, तीखे और मसालेदार खाद्य पदार्थों का सेवन (जैसे मिर्च, अचार, सिरका, खट्टा दही)।", "अनियमित खान-पान की आदतें, भोजन छोड़ना, या रात में बहुत देर से भोजन करना।", "किण्वित खाद्य पदार्थों (जैसे इडली, डोसा, ब्रेड), शराब और चाय/कॉफी का अत्यधिक सेवन।", "मानसिक तनाव, क्रोध, चिंता और अत्यधिक प्रतिस्पर्धा (पित्त बढ़ाने वाले कारक)।", "भूख, प्यास, पेशाब या शौच जैसे प्राकृतिक वेगों को रोकना।", "असंगत खाद्य संयोजनों का सेवन (विरुद्ध आहार)।"],
    causesGu: ["અતિશય ખાટા, તીખા અને મસાલેદાર ખોરાકનું સેવન (જેમ કે મરચું, અથાણું, સરકો, ખાટું દહીં).", "અનિયમિત ખાવાની ટેવો, ભોજન છોડવું, અથવા રાત્રે મોડેથી ભોજન કરવું.", "આથાવાળા ખોરાક (જેમ કે ઇડલી, ઢોસા, બ્રેડ), દારૂ અને ચા/કોફીનું અતિશય સેવન.", "માનસિક તણાવ, ક્રોધ અને ચિંતા (પિત્ત વધારનારા પરિબળો).", "કુદરતી આવેગોને દબાવવા.", "અસંગત ખોરાક સંયોજનોનું સેવન (વિરુદ્ધ આહાર)."],
    pathyaEn: ["Grains: Old rice (red/brown), barley, wheat (in moderation).", "Pulses: Moong dal (green gram).", "Vegetables: Bitter gourd (karela), bottle gourd (lauki), ridge gourd (turai), ash gourd, cucumber, cabbage, spinach (cooked), cauliflower (in moderation).", "Fruits: Sweet apple, pomegranate, ripe banana, melon, coconut water, grapes.", "Dairy: Cow's milk, ghee, fresh butter, fresh paneer.", "Spices & Herbs: Coriander (dhaniya), fennel (saunf), cardamom (elaichi), cumin (jeera), turmeric (haldi) in small amounts.", "Oils: Ghee, coconut oil (in moderation).", "Practical Tips: Eat timely and moderate meals. Avoid overeating. Chew food thoroughly. Drink plenty of plain water, especially between meals. Practice meditation, yoga, and ensure regular sleep. Include cooling drinks like fennel water or coconut water."],
    pathyaHi: ["अनाज: पुराने चावल, जौ, गेहूँ (मध्यम मात्रा में)।", "दालें: मूंग दाल।", "सब्जियां: करेला जैसी कड़वी सब्जियां, पत्तेदार साग।", "धनिया, सौंफ, इलायची जैसी शीतल जड़ी-बूटियाँ।", "समय पर और संतुलित भोजन।", "शांत मन, ध्यान, नियमित नींद।"],
    pathyaGu: ["દૂધ, ઘી, માખણ અને મીઠા ફળો.", "જવ, ઘઉં, જૂના ચોખા.", "કારેલા જેવી કડવી શાકભાજી, પાંદડાવાળા શાક.", "ધાણા, વરિયાળી, એલચી જેવી શીતળ ઔષધિઓ.", "સમયસર અને મધ્યમ ભોજન.", "શાંત મન, ધ્યાન, નિયમિત ઊંઘ."],
    apathyaEn: ["Sour, spicy, fried, and fermented foods.", "Curd, sour buttermilk, pickles.", "Excessive intake of tea, coffee, and alcohol.", "Night waking, excessive physical exertion.", "Stressful activities, anger, and anxiety."],
    apathyaHi: ["खट्टे, मसालेदार, तले हुए और किण्वित खाद्य पदार्थ।", "दही, खट्टी छाछ, अचार।", "चाय, कॉफी और शराब का अत्यधिक सेवन।", "रात में जागना, अत्यधिक शारीरिक श्रम।", "तनावपूर्ण गतिविधियाँ, क्रोध और चिंता।"],
    apathyaGu: ["ખાટા, મસાલેદાર, તળેલા અને આથાવાળા ખોરાક.", "દહીં, ખાટી છાશ, અથાણાં.", "ચા, કોફી અને દારૂનું અતિશય સેવન.", "રાત્રે જાગવું, અતિશય શારીરિક શ્રમ.", "તણાવપૂર્ણ પ્રવૃત્તિઓ, ક્રોધ અને ચિંતા."],
  },
  {
    id: "agnimandya",
    group: "Digestive Disorders",
    nameEn: "Agnimandya (Low Digestive Fire / Impaired Digestion)",
    nameHi: "अग्निमांद्य (मंद पाचन अग्नि / अपचन)",
    nameGu: "અગ્નિમાંદ્ય (મંદ પાચન અગ્નિ / અપચન)",
    causesEn: ["Eating heavy, cold, and indigestible foods.", "Overeating or eating before the previous meal is digested.", "Consuming incompatible food combinations (Viruddha Ahara).", "Lack of physical activity.", "Suppression of natural urges.", "Excessive worries, stress, and anxiety.", "Sleeping immediately after meals.", "Drinking too much cold water during or immediately after meals."],
    causesHi: ["भारी, ठंडे और अपचनीय खाद्य पदार्थों का सेवन।", "अधिक खाना या पहले भोजन के पचने से पहले भोजन करना।", "असंगत खाद्य संयोजनों का सेवन (विरुद्ध आहार)।", "शारीरिक गतिविधि का अभाव।", "प्राकृतिक वेगों को रोकना।", "अत्यधिक चिंता, तनाव और बेचैनी।", "भोजन के तुरंत बाद सोना।", "भोजन के दौरान या तुरंत बाद बहुत अधिक ठंडा पानी पीना।"],
    causesGu: ["ભારે, ઠંડા અને અપચનીય ખોરાકનું સેવન.", "વધારે ખાવું અથવા અગાઉનું ભોજન પચ્યા વિના ફરી ખાવું.", "અસંગત ખોરાક સંયોજનોનું સેવન (વિરુદ્ધ આહાર).", "શારીરિક પ્રવૃત્તિનો અભાવ.", "કુદરતી આવેગોને દબાવવા.", "અતિશય ચિંતાઓ, તણાવ અને ચિંતા.", "ભોજન પછી તરત જ સૂવું.", "ભોજન દરમિયાન અથવા તરત જ ખૂબ ઠંડુ પાણી પીવું."],
    pathyaEn: ["Grains: Old rice (red/brown), barley, wheat (lightly prepared), oats.", "Pulses: Moong dal (green gram) soup, masoor dal (red lentils).", "Vegetables: Bitter gourd (karela), bottle gourd (lauki), ridge gourd (turai), pumpkin, carrots, spinach, fenugreek leaves (methi).", "Fruits: Pomegranate, ripe papaya, apple, berries (light fruits).", "Spices & Herbs: Ginger (fresh and dried), cumin, coriander, black pepper, long pepper (pippali), asafoetida (hing), ajwain (carom seeds), rock salt.", "Dairy: Buttermilk (lightly spiced), fresh paneer (in small amounts if digestive fire is slightly improved).", "Oils: Ghee (in very small amounts, only if tolerated).", "Practical Tips: Eat light, warm, and freshly prepared food. Chew food thoroughly. Drink warm water before or after meals, not during. Start meals with a small piece of fresh ginger with rock salt. Include digestive appetizers (deepan-pachan) like buttermilk with ginger and cumin. Maintain regular eating times. Avoid daytime sleeping. Practice light yoga and walking."],
    pathyaHi: ["अनाज: पुराने चावल (लाल/भूरे), जौ, गेहूं (हल्के ढंग से तैयार), ओट्स।", "दालें: मूंग दाल का सूप, मसूर दाल।", "सब्जियां: करेला, लौकी, तोरई, कद्दू, गाजर, पालक, मेथी के पत्ते।", "फल: अनार, पका पपीता, सेब, जामुन (हल्के फल)।", "मसाले और जड़ी-बूटियाँ: अदरक (ताजा और सूखा), जीरा, धनिया, काली मिर्च, पिप्पली, हींग, अजवाइन, सेंधा नमक।", "डेयरी: छाछ (हल्के मसाले के साथ), ताजा पनीर (यदि पाचन अग्नि थोड़ी सुधरी हो तो कम मात्रा में)।", "तेल: घी (बहुत कम मात्रा में, यदि सहन हो)।", "व्यावहारिक सुझाव: हल्का, गर्म और ताजा बना भोजन करें। भोजन को अच्छी तरह चबाएं। भोजन से पहले या बाद में गर्म पानी पिएं, भोजन के दौरान नहीं। भोजन की शुरुआत सेंधा नमक के साथ एक छोटे टुकड़े ताजे अदरक से करें। अदरक और जीरे के साथ छाछ जैसे पाचक क्षुधावर्धक (दीपन-पाचन) शामिल करें। नियमित खाने का समय बनाए रखें। दिन में सोने से बचें। हल्का योग और चलना (वॉकिंग) करें।"],
    pathyaGu: ["અનાજ: જૂના ચોખા (લાલ/ભૂરા), જવ, ઘઉં (હળવા તૈયાર કરેલા), ઓટ્સ.", "દાળો: મગની દાળનો સૂપ, મસૂર દાળ.", "શાકભાજી: કારેલા, દૂધી, તુરિયા, કોળું, ગાજર, પાલક, મેથીના પાન.", "ફળો: દાડમ, પાકું પપૈયું, સફરજન, બેરી (હળવા ફળો).", "મસાલા અને ઔષધિઓ: આદુ (તાજુ અને સૂકું), જીરું, ધાણા, કાળા મરી, પીપળી, હિંગ, અજમો, સિંધવ મીઠું.", "ડેરી: છાશ (હળવા મસાલા સાથે), તાજું પનીર (જો પાચન અગ્નિ થોડી સુધરી હોય તો ઓછી માત્રામાં).", "તેલ: ઘી (ખૂબ ઓછી માત્રામાં, જો સહન થાય તો).", "વ્યવહારુ ટિપ્સ: હળવો, ગરમ અને તાજો તૈયાર કરેલો ખોરાક ખાઓ. ખોરાકને સારી રીતે ચાવો. ભોજન પહેલાં અથવા પછી ગરમ પાણી પીવો, ભોજન દરમિયાન નહીં. સિંધવ મીઠું સાથે આદુના નાના ટુકડાથી ભોજનની શરૂઆત કરો. આદુ અને જીરા સાથે છાશ જેવા પાચક એપેટાઇઝર (દીપન-પાચન) શામેલ કરો. નિયમિત ભોજનનો સમય જાળવો. દિવસમાં સૂવાનું ટાળો. હળવો યોગ અને ચાલવાનું રાખો."],
    apathyaEn: ["Heavy, fried, oily, and cold foods.", "Raw vegetables, salads (difficult to digest).", "Dairy products like curd, cheese, ice cream (except buttermilk).", "Processed and refined foods, fast food.", "Meat, fish (especially heavy ones).", "Excessive intake of sweets, pastries, and bread.", "Cold drinks, chilled water, and fruit juices.", "Late-night meals, eating when not hungry, or overeating."],
    apathyaHi: ["भारी, तले हुए, तैलीय और ठंडे खाद्य पदार्थ।", "कच्ची सब्जियां, सलाद (पचाने में मुश्किल)।", "दही, पनीर, आइसक्रीम जैसे डेयरी उत्पाद (छाछ को छोड़कर)।", "प्रसंस्कृत और परिष्कृत खाद्य पदार्थ, फास्ट फूड।", "मांस, मछली (विशेषकर भारी वाले)।", "मिठाई, पेस्ट्री और ब्रेड का अत्यधिक सेवन।", "ठंडे पेय, ठंडा पानी और फलों के रस।", "देर रात भोजन करना, भूख न लगने पर खाना, या अधिक खाना।"],
    apathyaGu: ["ભારે, તળેલા, તેલયુક્ત અને ઠંડા ખોરાક.", "કાચી શાકભાજી, સલાડ (પચાવવા મુશ્કેલ).", "દહીં, ચીઝ, આઈસ્ક્રીમ જેવા ડેરી ઉત્પાદનો (છાશ સિવાય).", "પ્રક્રિયા કરેલા અને રિફાઈન્ડ ખોરાક, ફાસ્ટ ફૂડ.", "માંસ, માછલી (ખાસ કરીને ભારે).", "મીઠાઈઓ, પેસ્ટ્રીઝ અને બ્રેડનું અતિશય સેવન.", "ઠંડા પીણાં, ઠંડુ પાણી અને ફળોના રસ.", "રાત્રે મોડેથી ભોજન કરવું, ભૂખ ન લાગી હોય ત્યારે ખાવું, અથવા વધુ ખાવું."],
  },
  {
    id: "ajirna",
    group: "Digestive Disorders",
    nameEn: "Ajirna (Indigestion)",
    nameHi: "अजीर्ण (अपच)",
    nameGu: "અજીર્ણ (અપચો)",
    causesEn: ["Eating heavy, cold, or dry foods.", "Overeating or eating before the previous meal is fully digested.", "Eating incompatible food combinations (Viruddha Ahara).", "Suppression of natural urges (like hunger, thirst).", "Emotional factors such as stress, anger, anxiety while eating.", "Eating too quickly without proper chewing.", "Lack of physical activity after meals.", "Consuming excess water during meals."],
    causesHi: ["भारी, ठंडे या सूखे खाद्य पदार्थों का सेवन।", "अधिक खाना या पहले भोजन के पूरी तरह पचने से पहले भोजन करना।", "असंगत खाद्य संयोजनों का सेवन (विरुद्ध आहार)।", "प्राकृतिक वेगों (जैसे भूख, प्यास) को रोकना।", "खाने के दौरान तनाव, क्रोध, चिंता जैसे भावनात्मक कारक।", "ठीक से चबाए बिना बहुत जल्दी खाना।", "भोजन के बाद शारीरिक गतिविधि का अभाव।", "भोजन के दौरान अधिक पानी पीना।"],
    causesGu: ["ભારે, ઠંડા અથવા સૂકા ખોરાકનું સેવન.", "વધારે ખાવું અથવા અગાઉનું ભોજન સંપૂર્ણપણે પચ્યા પહેલાં ભોજન કરવું.", "અસંગત ખોરાક સંયોજનોનું સેવન (વિરુદ્ધ આહાર).", "કુદરતી આવેગો (જેમ કે ભૂખ, તરસ) ને દબાવવા.", "ભોજન કરતી વખતે તણાવ, ક્રોધ, ચિંતા જેવા ભાવનાત્મક પરિબળો.", "યોગ્ય રીતે ચાવ્યા વિના ખૂબ જ ઝડપથી ખાવું.", "ભોજન પછી શારીરિક પ્રવૃત્તિનો અભાવ.", "ભોજન દરમિયાન વધુ પડતું પાણી પીવું."],
    pathyaEn: ["Grains: Old rice, barley, wheat (lightly prepared like gruel or chapati).", "Pulses: Moong dal (green gram) soup or khichdi.", "Vegetables: Bitter gourd, bottle gourd, ridge gourd, pumpkin, carrots (steamed or boiled).", "Fruits: Pomegranate, ripe papaya, apple (cooked), grapes.", "Spices & Herbs: Fresh ginger, black pepper, long pepper (pippali), cumin, coriander, asafoetida (hing), ajwain, rock salt.", "Dairy: Buttermilk (light, spiced with ginger and cumin).", "Drinks: Warm water, ginger tea, cumin water.", "Practical Tips: Eat light, warm, and freshly cooked meals. Eat only when genuinely hungry. Chew food thoroughly and eat slowly. Avoid eating when stressed or upset. Drink warm water throughout the day. Take a short, gentle walk after meals. Fasting for a short period (langhanam) or having liquid diet can be beneficial."],
    pathyaHi: ["अनाज: पुराने चावल, जौ, गेहूं (दलिया या चपाती जैसे हल्के ढंग से तैयार)।", "दालें: मूंग दाल का सूप या खिचड़ी।", "सब्जियां: करेला, लौकी, तोरई, कद्दू, गाजर (भाप में पकाई या उबली हुई)।", "फल: अनार, पका पपीता, सेब (पका हुआ), अंगूर।", "मसाले और जड़ी-बूटियाँ: ताजा अदरक, काली मिर्च, पिप्पली, जीरा, धनिया, हींग, अजवाइन, सेंधा नमक।", "डेयरी: छाछ (हल्की, अदरक और जीरे के साथ मसालेदार)।", "पेय: गर्म पानी, अदरक की चाय, जीरा पानी।", "व्यावहारिक सुझाव: हल्का, गर्म और ताजा पका भोजन करें। तभी खाएं जब वास्तव में भूख लगी हो। भोजन को अच्छी तरह चबाएं और धीरे-धीरे खाएं। तनावग्रस्त या परेशान होने पर खाने से बचें। दिन भर गर्म पानी पिएं। भोजन के बाद थोड़ी देर टहलें। थोड़े समय के लिए उपवास (लंघन) या तरल आहार लेना फायदेमंद हो सकता है।"],
    pathyaGu: ["અનાજ: જૂના ચોખા, જવ, ઘઉં (હળવા તૈયાર કરેલા જેમ કે દલિયા કે રોટલી).", "દાળો: મગની દાળનો સૂપ અથવા ખીચડી.", "શાકભાજી: કારેલા, દૂધી, તુરિયા, કોળું, ગાજર (બાફેલી અથવા બાફેલી).", "ફળો: દાડમ, પાકું પપૈયું, સફરજન (રાંધેલું), દ્રાક્ષ.", "મસાલા અને ઔષધિઓ: તાજુ આદુ, કાળા મરી, પીપળી, જીરું, ધાણા, હિંગ, અજમો, સિંધવ મીઠું.", "ડેરી: છાશ (હળવી, આદુ અને જીરા સાથે મસાલાયુક્ત).", "પીણાં: ગરમ પાણી, આદુની ચા, જીરા પાણી.", "વ્યવહારુ ટિપ્સ: હળવા, ગરમ અને તાજા રાંધેલા ભોજન લો. જ્યારે ખરેખર ભૂખ લાગી હોય ત્યારે જ ખાઓ. ખોરાકને સારી રીતે ચાવો અને ધીમે ધીમે ખાઓ. તણાવમાં કે અસ્વસ્થ હો ત્યારે ખાવાનું ટાળો. દિવસભર ગરમ પાણી પીવો. ભોજન પછી થોડી હળવી ચાલ કરો. ટૂંકા ગાળા માટે ઉપવાસ (લંઘન) અથવા પ્રવાહી આહાર લાભદાયી હોઈ શકે છે."],
    apathyaEn: ["Heavy, fried, oily, processed, and packaged foods.", "Excessively cold foods and drinks (ice cream, chilled beverages).", "Raw salads and uncooked vegetables (especially if Agni is very low).", "Incompatible food combinations (e.g., milk with sour fruits/fish).", "Pulses like urad dal, rajma (kidney beans), chana (chickpeas) (heavy to digest).", "Excessive intake of sweets, bakery products, and fermented foods.", "Meat and fish (especially red meat and heavy fish).", "Eating when not hungry, overeating, or eating very quickly.", "Sleeping immediately after meals, lack of physical activity."],
    apathyaHi: ["भारी, तले हुए, तैलीय, प्रसंस्कृत और पैकेटबंद खाद्य पदार्थ।", "अत्यधिक ठंडे खाद्य पदार्थ और पेय (आइसक्रीम, ठंडे पेय)।", "कच्चे सलाद और बिना पकी सब्जियां (विशेषकर यदि अग्नि बहुत कम हो)।", "असंगत खाद्य संयोजन (जैसे दूध के साथ खट्टे फल/मछली)।", "उड़द दाल, राजमा, चना जैसी दालें (पचाने में भारी)।", "मिठाई, बेकरी उत्पादों और किण्वित खाद्य पदार्थों का अत्यधिक सेवन।", "मांस और मछली (विशेषकर लाल मांस और भारी मछली)।", "भूख न लगने पर खाना, अधिक खाना या बहुत जल्दी खाना।", "भोजन के तुरंत बाद सोना, शारीरिक गतिविधि का अभाव।"],
    apathyaGu: ["ભારે, તળેલા, તેલયુક્ત, પ્રક્રિયા કરેલા અને પેકેજ્ડ ખોરાક.", "અતિશય ઠંડા ખોરાક અને પીણાં (આઈસ્ક્રીમ, ઠંડા પીણાં).", "કાચી શાકભાજી, સલાડ (પચાવવા મુશ્કેલ).", "અસંગત ખોરાક સંયોજનો (દા.ત., દૂધ સાથે ખાટા ફળો/માછલી).", "અડદ દાળ, રાજમા, ચણા જેવી દાળો (પચવામાં ભારે).", "મીઠાઈઓ, બેકરી ઉત્પાદનો અને આથાવાળા ખોરાકનું અતિશય સેવન.", "માંસ અને માછલી (ખાસ કરીને લાલ માંસ અને ભારે માછલી).", "ભૂખ ન લાગી હોય ત્યારે ખાવું, વધુ ખાવું અથવા ખૂબ ઝડપથી ખાવું.", "ભોજન પછી તરત જ સૂવું, શારીરિક પ્રવૃત્તિનો અભાવ."],
  },
  {
    id: "atisara",
    group: "Digestive Disorders",
    nameEn: "Atisara (Diarrhea)",
    nameHi: "अतिसार (दस्त)",
    nameGu: "અતિસાર (ઝાડા)",
    causesEn: ["Consumption of unhygienic, contaminated, or incompatible food and water.", "Eating excessively spicy, oily, or heavy foods.", "Irregular eating habits or overeating.", "Emotional factors like fear, grief, anxiety.", "Seasonal changes and weakened digestive fire (Agni).", "Suppression of natural urges, especially vomiting.", "Excessive intake of alcohol."],
    causesHi: ["अस्वास्थ्यकर, दूषित या असंगत भोजन और पानी का सेवन।", "अत्यधिक मसालेदार, तैलीय या भारी खाद्य पदार्थों का सेवन।", "अनियमित खान-पान की आदतें या अधिक खाना।", "डर, दुःख, चिंता जैसे भावनात्मक कारक।", "मौसमी परिवर्तन और कमजोर पाचन अग्नि (अग्नि)।", "प्राकृतिक वेगों को रोकना, विशेषकर उल्टी को।", "शराब का अत्यधिक सेवन।"],
    causesGu: ["અસ્વચ્છ, દૂષિત અથવા અસંગત ખોરાક અને પાણીનું સેવન.", "અતિશય મસાલેદાર, તેલયુક્ત અથવા ભારે ખોરાકનું સેવન.", "અનિયમિત ખાવાની ટેવો અથવા વધુ ખાવું.", "ભય, શોક, ચિંતા જેવા ભાવનાત્મક પરિબળો.", "મોસમી ફેરફારો અને નબળી પાચન અગ્નિ (અગ્નિ).", "કુદરતી આવેગોને દબાવવા, ખાસ કરીને ઉલટીને.", "દારૂનું અતિશય સેવન."],
    pathyaEn: ["Grains: Old rice (laghu, light), roasted barley flour (sattu).", "Pulses: Moong dal (green gram) soup.", "Vegetables: Bottle gourd, ridge gourd, pumpkin, raw banana, tender leaves (lightly cooked).", "Fruits: Pomegranate, ripe banana (in moderation), apple sauce, Bael fruit (wood apple).", "Spices & Herbs: Ginger (dried, shunthi), cumin, coriander, nutmeg (jaiphal), rock salt.", "Dairy: Buttermilk (chhaas) with rock salt and ginger.", "Drinks: Warm water, boiled water cooled to lukewarm, rice gruel (kanji), buttermilk.", "Practical Tips: Fasting (langhanam) or light liquid diet initially. Eat small, frequent, and easily digestible meals. Avoid cold water and drinks. Take rest. Maintain proper hydration by drinking warm water or buttermilk. Consume freshly prepared and warm food. Avoid food that irritates the bowel."],
    pathyaHi: ["अनाज: पुराने चावल (लघु, हल्का), भुना जौ का आटा (सत्तू)।", "दालें: मूंग दाल का सूप।", "सब्जियां: लौकी, तोरई, कद्दू, कच्चा केला, मुलायम पत्ते (हल्के पके हुए)।", "फल: अनार, पका केला (मध्यम मात्रा में), सेब का सॉस, बेल फल।", "मसाले और जड़ी-बूटियाँ: सूखी अदरक (शुंठी), जीरा, धनिया, जायफल, सेंधा नमक।", "डेयरी: छाछ (सेंधा नमक और अदरक के साथ)।", "पेय: गर्म पानी, उबला हुआ पानी जो गुनगुना हो गया हो, चावल की कांजी, छाछ।", "व्यावहारिक सुझाव: शुरू में उपवास (लंघन) या हल्का तरल आहार। छोटे, बार-बार और आसानी से पचने वाले भोजन करें। ठंडा पानी और पेय से बचें। आराम करें। गर्म पानी या छाछ पीकर उचित हाइड्रेशन बनाए रखें। ताजा बना और गर्म भोजन का सेवन करें। आंतों को परेशान करने वाले भोजन से बचें।"],
    pathyaGu: ["અનાજ: જૂના ચોખા (લઘુ, હળવા), શેકેલો જવનો લોટ (સત્તુ).", "દાળો: મગની દાળનો સૂપ.", "શાકભાજી: દૂધી, તુરિયા, કોળું, કાચું કેળું, કોમળ પાંદડા (હળવા રાંધેલા).", "ફળો: દાડમ, પાકું કેળું (મધ્યમ માત્રામાં), સફરજનનો સોસ, બીલ ફળ.", "મસાલા અને ઔષધિઓ: સૂંઠ (શુન્થી), જીરું, ધાણા, જાયફળ, સિંધવ મીઠું.", "ડેરી: છાશ (સિંધવ મીઠું અને આદુ સાથે).", "પીણાં: ગરમ પાણી, ઉકાળીને હુફાળું કરેલું પાણી, ચોખાની કાંજી, છાશ.", "વ્યવહારુ ટિપ્સ: શરૂઆતમાં ઉપવાસ (લંઘન) અથવા હળવો પ્રવાહી આહાર. નાના, વારંવાર અને સરળતાથી પચી શકે તેવા ભોજન લો. ઠંડા પાણી અને પીણાં ટાળો. આરામ કરો. ગરમ પાણી અથવા છાશ પીને યોગ્ય હાઈડ્રેશન જાળવો. તાજા તૈયાર કરેલા અને ગરમ ખોરાકનું સેવન કરો. આંતરડાને હેરાન કરતા ખોરાકથી બચો."],
    apathyaEn: ["Heavy, oily, fried, raw, and difficult-to-digest foods.", "Excessively spicy, sour, or salty foods.", "Milk and milk products (except buttermilk).", "Red meat, fish, eggs.", "Pulses like urad dal, chana, rajma.", "Cold water, chilled beverages, ice cream.", "Fermented foods, bakery products.", "Vegetables like cabbage, cauliflower, peas (may cause gas).", "Alcohol, caffeine, and tobacco.", "Overeating, eating at irregular times."],
    apathyaHi: ["भारी, तैलीय, तले हुए, कच्चे और पचने में कठिन खाद्य पदार्थ।", "अत्यधिक मसालेदार, खट्टे या नमकीन खाद्य पदार्थ।", "दूध और दूध के उत्पाद (छाछ को छोड़कर)।", "लाल मांस, मछली, अंडे।", "उड़द दाल, चना, राजमा जैसी दालें।", "ठंडा पानी, ठंडे पेय, आइसक्रीम।", "किण्वित खाद्य पदार्थ, बेकरी उत्पाद।", "पत्ता गोभी, फूलगोभी, मटर जैसी सब्जियां (गैस कर सकती हैं)।", "शराब, कैफीन और तंबाकू।", "अधिक खाना, अनियमित समय पर खाना।"],
    apathyaGu: ["ભારે, તેલયુક્ત, તળેલા, કાચા અને પચવામાં મુશ્કેલ ખોરાક.", "અતિશય મસાલેદાર, ખાટા અથવા ખારા ખોરાક.", "દૂધ અને દૂધના ઉત્પાદનો (છાશ સિવાય).", "લાલ માંસ, માછલી, ઇંડા.", "અડદ દાળ, ચણા, રાજમા જેવી દાળો.", "ઠંડુ પાણી, ઠંડા પીણાં, આઈસ્ક્રીમ.", "આથાવાળા ખોરાક, બેકરી ઉત્પાદનો.", "કોબીજ, ફ્લાવર, વટાણા જેવી શાકભાજી (ગેસ કરી શકે છે).", "દારૂ, કેફીન અને તમાકુ.", "વધુ ખાવું, અનિયમિત સમયે ખાવું."],
  },
  {
    id: "grahani",
    group: "Digestive Disorders",
    nameEn: "Grahani (IBS / Malabsorption Syndrome)",
    nameHi: "ग्रहणी (आईबीएस / कुपोषण सिंड्रोम)",
    nameGu: "ગ્રહણી (આઈબીએસ / કુપોષણ સિન્ડ્રોમ)",
    causesEn: ["Repeated indigestion (Ajirna) or frequent episodes of diarrhea (Atisara).", "Eating incompatible food combinations (Viruddha Ahara).", "Eating before the previous meal is digested.", "Excessive intake of dry, cold, heavy, or irregular meals.", "Suppression of natural urges.", "Chronic mental stress, anxiety, and fear affecting digestion.", "Weakened digestive fire (Agni) leading to improper assimilation of food."],
    causesHi: ["बार-बार अपच (अजीर्ण) या दस्त (अतिसार) के बार-बार होने वाले प्रकरण।", "असंगत खाद्य संयोजनों का सेवन (विरुद्ध आहार)।", "पहले भोजन के पचने से पहले भोजन करना।", "सूखे, ठंडे, भारी या अनियमित भोजन का अत्यधिक सेवन।", "प्राकृतिक वेगों को रोकना।", "पुरानी मानसिक तनाव, चिंता और डर जो पाचन को प्रभावित करते हैं।", "कमजोर पाचन अग्नि (अग्नि) जिसके कारण भोजन का अनुचित आत्मसात होता है।"],
    causesGu: ["વારંવાર અપચો (અજીર્ણ) અથવા ઝાડા (અતિસાર) ના વારંવારના એપિસોડ્સ.", "અસંગત ખોરાક સંયોજનોનું સેવન (વિરુદ્ધ આહાર).", "અગાઉનું ભોજન પચ્યા પહેલાં ભોજન કરવું.", "સૂકા, ઠંડા, ભારે અથવા અનિયમિત ભોજનનું અતિશય સેવન.", "કુદરતી આવેગોને દબાવવા.", "લાંબા સમય સુધી માનસિક તણાવ, ચિંતા અને ભય જે પાચનને અસર કરે છે.", "નબળી પાચન અગ્નિ (અગ્નિ) જેના કારણે ખોરાકનું અયોગ્ય પાચન થાય છે."],
    pathyaEn: ["Grains: Old rice (red/brown), barley, wheat (in small, easily digestible forms like thin rotis).", "Pulses: Moong dal (green gram) soup or thin khichdi.", "Vegetables: Bottle gourd, ridge gourd, pumpkin, raw banana, spinach (cooked), carrots, ginger.", "Fruits: Pomegranate, ripe papaya, apple (cooked), Bael fruit (wood apple).", "Spices & Herbs: Dried ginger (shunthi), cumin, coriander, asafoetida (hing), ajwain, black pepper, rock salt, long pepper (pippali).", "Dairy: Buttermilk (chhaas) with rock salt, ginger, and cumin.", "Oils: Ghee (in very small amounts, only if tolerated and improves Agni).", "Practical Tips: Eat light, warm, and easily digestible food. Always eat freshly prepared meals. Eat small, frequent meals rather than large ones. Chew food slowly and thoroughly. Drink warm water throughout the day. Avoid cold water and drinks. Incorporate digestive appetizers. Avoid overeating and eating when not hungry. Maintain a calm and stress-free mind. Regular light exercise like walking or yoga is beneficial."],
    pathyaHi: ["अनाज: पुराने चावल (लाल/भूरे), जौ, गेहूं (पतली रोटी जैसे छोटे, आसानी से पचने वाले रूप में)।", "दालें: मूंग दाल का सूप या पतली खिचड़ी।", "सब्जियां: लौकी, तोरई, कद्दू, कच्चा केला, पालक (पका हुआ), गाजर, अदरक।", "फल: अनार, पका पपीता, सेब (पका हुआ), बेल फल।", "मसाले और जड़ी-बूटियाँ: सूखी अदरक (शुंठी), जीरा, धनिया, हींग, अजवाइन, काली मिर्च, सेंधा नमक, पिप्पली।", "डेयरी: छाछ (सेंधा नमक, अदरक और जीरा के साथ)।", "तेल: घी (बहुत कम मात्रा में, यदि सहन हो और अग्नि में सुधार हो)।", "व्यावहारिक सुझाव: हल्का, गर्म और आसानी से पचने वाला भोजन करें। हमेशा ताजा बना भोजन करें। बड़े भोजन के बजाय छोटे, बार-बार भोजन करें। भोजन को धीरे-धीरे और अच्छी तरह चबाएं। दिन भर गर्म पानी पिएं। ठंडे पानी और पेय से बचें। पाचक क्षुधावर्धक शामिल करें। अधिक खाने और भूख न लगने पर खाने से बचें। शांत और तनाव मुक्त मन बनाए रखें। चलना या योग जैसे नियमित हल्के व्यायाम फायदेमंद होते हैं।"],
    pathyaGu: ["અનાજ: જૂના ચોખા (લાલ/ભૂરા), જવ, ઘઉં (પાતળી રોટલી જેવા નાના, સરળતાથી પચી શકે તેવા સ્વરૂપમાં).", "દાળો: મગની દાળનો સૂપ અથવા પાતળી ખીચડી.", "શાકભાજી: દૂધી, તુરિયા, કોળું, કાચું કેળું, પાલક (રાંધેલું), ગાજર, આદુ.", "ફળો: દાડમ, પાકું પપૈયું, સફરજન (રાંધેલું), બીલ ફળ.", "મસાલા અને ઔષધિઓ: સૂંઠ (શુન્થી), જીરું, ધાણા, હિંગ, અજમો, કાળા મરી, સિંધવ મીઠું, પીપળી.", "ડેરી: છાશ (સિંધવ મીઠું, આદુ અને જીરા સાથે).", "તેલ: ઘી (ખૂબ ઓછી માત્રામાં, જો સહન થાય અને અગ્નિમાં સુધારો થાય).", "વ્યવહારુ ટિપ્સ: હળવો, ગરમ અને સરળતાથી પચી શકે તેવો ખોરાક લો. હંમેશા તાજા તૈયાર કરેલા ભોજન લો. મોટા ભોજનને બદલે નાના, વારંવાર ભોજન લો. ખોરાકને ધીમે ધીમે અને સારી રીતે ચાવો. દિવસભર ગરમ પાણી પીવો. ઠંડા પાણી અને પીણાં ટાળો. પાચક એપેટાઇઝર શામેલ કરો. વધુ ખાવાનું અને ભૂખ ન લાગી હોય ત્યારે ખાવાનું ટાળો. શાંત અને તણાવમુક્ત મન જાળવો. ચાલવું અથવા યોગ જેવી નિયમિત હળવી કસરત ફાયદાકારક છે."],
    apathyaEn: ["Heavy, fried, oily, processed, and cold foods.", "Excessively spicy, sour, or raw foods.", "Incompatible food combinations (e.g., milk with fish, sour fruits, or fermented foods).", "Pulses like urad dal, rajma, chana (difficult to digest).", "Dairy products like curd, cheese, ice cream (except buttermilk).", "Excessive intake of sweets, bakery products, and fermented foods.", "Red meat and heavy fish.", "Cold water, chilled beverages, and fruit juices.", "Overeating, eating at irregular times, or eating when not hungry.", "Emotional disturbances, sleeping immediately after meals, lack of physical activity."],
    apathyaHi: ["भारी, तले हुए, तैलीय, प्रसंस्कृत और ठंडे खाद्य पदार्थ।", "अत्यधिक मसालेदार, खट्टे या कच्चे खाद्य पदार्थ।", "असंगत खाद्य संयोजन (जैसे दूध के साथ मछली, खट्टे फल, या किण्वित खाद्य पदार्थ)।", "उड़द दाल, राजमा, चना जैसी दालें (पचाने में कठिन)।", "दही, पनीर, आइसक्रीम जैसे डेयरी उत्पाद (छाछ को छोड़कर)।", "मिठाई, बेकरी उत्पादों और किण्वित खाद्य पदार्थों का अत्यधिक सेवन।", "लाल मांस और भारी मछली।", "ठंडा पानी, ठंडे पेय और फलों के रस।", "अधिक खाना, अनियमित समय पर खाना, या भूख न लगने पर खाना।", "भावनात्मक परेशानियां, भोजन के तुरंत बाद सोना, शारीरिक गतिविधि का अभाव।"],
    apathyaGu: ["ભારે, તેલયુક્ત, તળેલા, પ્રક્રિયા કરેલા અને ઠંડા ખોરાક.", "અતિશય મસાલેદાર, ખાટા અથવા કાચા ખોરાક.", "અસંગત ખોરાક સંયોજનો (દા.ત., દૂધ સાથે માછલી, ખાટા ફળો, અથવા આથાવાળા ખોરાક).", "અડદ દાળ, રાજમા, ચણા જેવી દાળો (પચવામાં મુશ્કેલ).", "દહીં, ચીઝ, આઈસ્ક્રીમ જેવા ડેરી ઉત્પાદનો (છાશ સિવાય).", "મીઠાઈઓ, બેકરી ઉત્પાદનો અને આથાવાળા ખોરાકનું અતિશય સેવન.", "લાલ માંસ અને ભારે માછલી.", "ઠંડુ પાણી, ઠંડા પીણાં અને ફળોના રસ.", "વધુ ખાવું, અનિયમિત સમયે ખાવું, અથવા ભૂખ ન લાગી હોય ત્યારે ખાવું.", "ભાવનાત્મક વિક્ષેપો, ભોજન પછી તરત જ સૂવું, શારીરિક પ્રવૃત્તિનો અભાવ."],
  },
  {
    id: "arsha",
    group: "Digestive Disorders",
    nameEn: "Arsha (Piles / Hemorrhoids)",
    nameHi: "अर्श (बवासीर / बवासीर)",
    nameGu: "અર્શ (મસા / હરસ)",
    causesEn: ["Chronic constipation (Vibandha) and straining during defecation.", "Excessive intake of dry, cold, spicy, and heavy-to-digest foods.", "Lack of fiber in the diet.", "Suppression of natural urges, especially defecation.", "Sedentary lifestyle and lack of physical activity.", "Prolonged sitting or standing.", "Pregnancy and childbirth.", "Obesity and increased abdominal pressure."],
    causesHi: ["पुरानी कब्ज (विबंध) और शौच के दौरान जोर लगाना।", "सूखे, ठंडे, मसालेदार और पचने में भारी खाद्य पदार्थों का अत्यधिक सेवन।", "आहार में फाइबर की कमी।", "प्राकृतिक वेगों को रोकना, विशेषकर शौच को।", "आलसी जीवन शैली और शारीरिक गतिविधि का अभाव।", "लंबे समय तक बैठना या खड़े रहना।", "गर्भावस्था और प्रसव।", "मोटापा और पेट के दबाव में वृद्धि।"],
    causesGu: ["લાંબા સમયથી કબજિયાત (વિબંધ) અને મળત્યાગ દરમિયાન જોર કરવું.", "સૂકા, ઠંડા, મસાલેદાર અને પચવામાં ભારે ખોરાકનું અતિશય સેવન.", "આહારમાં ફાઈબરનો અભાવ.", "કુદરતી આવેગોને દબાવવા, ખાસ કરીને મળત્યાગને.", "બેઠાડુ જીવનશૈલી અને શારીરિક પ્રવૃત્તિનો અભાવ.", "લાંબા સમય સુધી બેસવું અથવા ઊભા રહેવું.", "ગર્ભાવસ્થા અને પ્રસૂતિ.", "સ્થૂળતા અને પેટના દબાણમાં વધારો."],
    pathyaEn: ["Grains: Old rice, wheat, barley, oats (rich in fiber).", "Pulses: Moong dal, masoor dal (lightly cooked).", "Vegetables: Green leafy vegetables (spinach, fenugreek), bottle gourd, ridge gourd, pumpkin, carrots, beetroot, radish (cooked), elephant foot yam (suran).", "Fruits: Ripe papaya, figs, apples, pears, bananas, grapes, oranges.", "Spices & Herbs: Cumin, coriander, turmeric, ginger (fresh), asafoetida (hing), Triphala (powder at night).", "Dairy: Buttermilk, cow's milk, ghee (in moderation).", "Oils: Ghee, olive oil (in moderation to soften stools).", "Practical Tips: Increase fiber intake. Drink plenty of warm water throughout the day. Avoid straining during defecation. Maintain regular bowel habits. Include freshly prepared, warm, and easily digestible food. Regular light exercise is beneficial. Avoid prolonged sitting. Practice gentle yoga poses."],
    pathyaHi: ["अनाज: पुराने चावल, गेहूं, जौ, ओट्स (फाइबर से भरपूर)।", "दालें: मूंग दाल, मसूर दाल (हल्की पकी हुई)।", "सब्जियां: हरी पत्तेदार सब्जियां (पालक, मेथी), लौकी, तोरई, कद्दू, गाजर, चुकंदर, मूली (पकी हुई), सूरन।", "फल: पका पपीता, अंजीर, सेब, नाशपाती, केला, अंगूर, संतरे।", "मसाले और जड़ी-बूटियाँ: जीरा, धनिया, हल्दी, अदरक (ताजा), हींग, त्रिफला (रात में चूर्ण)।", "डेयरी: छाछ, गाय का दूध, घी (मध्यम मात्रा में)।", "तेल: घी, जैतून का तेल (मल को नरम करने के लिए मध्यम मात्रा में)।", "व्यावहारिक सुझाव: फाइबर का सेवन बढ़ाएं। दिन भर खूब गर्म पानी पिएं। शौच के दौरान जोर लगाने से बचें। नियमित मल त्याग की आदतें बनाए रखें। ताजा बना, गर्म और आसानी से पचने वाला भोजन शामिल करें। नियमित हल्का व्यायाम फायदेमंद है। लंबे समय तक बैठने से बचें। कोमल योग आसन का अभ्यास करें।"],
    pathyaGu: ["અનાજ: જૂના ચોખા, ઘઉં, જવ, ઓટ્સ (ફાઈબરથી ભરપૂર).", "દાળો: મગની દાળ, મસૂર દાળ (હળવી રાંધેલી).", "શાકભાજી: લીલા પાંદડાવાળી શાકભાજી (પાલક, મેથી), દૂધી, તુરિયા, કોળું, ગાજર, બીટરૂટ, મૂળો (રાંધેલું), સુરન.", "ફળો: પાકું પપૈયું, અંજીર, સફરજન, નાશપતી, કેળા, દ્રાક્ષ, નારંગી.", "મસાલા અને ઔષધિઓ: જીરું, ધાણા, હળદર, આદુ (તાજુ), હિંગ, ત્રિફળા (રાત્રે ચૂર્ણ).", "ડેરી: છાશ, ગાયનું દૂધ, ઘી (મધ્યમ માત્રામાં).", "તેલ: ઘી, ઓલિવ તેલ (મળને નરમ કરવા માટે મધ્યમ માત્રામાં).", "વ્યવહારુ ટિપ્સ: ફાઈબરનું સેવન વધારો. દિવસભર પુષ્કળ ગરમ પાણી પીવો. મળત્યાગ દરમિયાન જોર કરવાનું ટાળો. નિયમિત આંતરડાની આદતો જાળવો. તાજા તૈયાર કરેલા, ગરમ અને સરળતાથી પચી શકે તેવા ખોરાકનો સમાવેશ કરો. નિયમિત હળવી કસરત ફાયદાકારક છે. લાંબા સમય સુધી બેસવાનું ટાળો. હળવા યોગાસનનો અભ્યાસ કરો."],
    apathyaEn: ["Dry, cold, spicy, and heavy-to-digest foods (e.g., fast food, processed snacks).", "Foods that cause constipation (e.g., maida/refined flour products, excessive cheese).", "Root vegetables like potato, sweet potato (in excess).", "Urad dal, chana, rajma (can be difficult to digest).", "Pungent, sour, and astringent tastes in excess.", "Excessive tea, coffee, and alcohol.", "Suppression of natural urges.", "Sedentary lifestyle and prolonged sitting."],
    apathyaHi: ["सूखे, ठंडे, मसालेदार और पचने में भारी खाद्य पदार्थ (जैसे फास्ट फूड, प्रसंस्कृत स्नैक्स)।", "कब्ज पैदा करने वाले खाद्य पदार्थ (जैसे मैदा/परिष्कृत आटा उत्पाद, अत्यधिक पनीर)।", "आलू, शकरकंद जैसे जड़ वाली सब्जियां (अत्यधिक मात्रा में)।", "उड़द दाल, चना, राजमा (पचाने में कठिन हो सकते हैं)।", "तीखे, खट्टे और कसैले स्वाद का अत्यधिक सेवन।", "अत्यधिक चाय, कॉफी और शराब।", "प्राकृतिक वेगों को रोकना।", "आलसी जीवन शैली और लंबे समय तक बैठना।"],
    apathyaGu: ["સૂકા, ઠંડા, મસાલેદાર અને પચવામાં ભારે ખોરાક (જેમ કે ફાસ્ટ ફૂડ, પ્રોસેસ્ડ સ્નેક્સ).", "કબજિયાત કરતા ખોરાક (જેમ કે મેંદા/રિફાઇન્ડ લોટના ઉત્પાદનો, અતિશય ચીઝ).", "બટાકા, શક્કરિયા જેવા કંદમૂળ શાકભાજી (વધારે પ્રમાણમાં).", "અડદ દાળ, ચણા, રાજમા (પચવામાં મુશ્કેલ હોઈ શકે છે).", "તીખા, ખાટા અને તુરા સ્વાદનું અતિશય સેવન.", "અતિશય ચા, કોફી અને દારૂ.", "કુદરતી આવેગોને દબાવવા.", "બેઠાડુ જીવનશૈલી અને લાંબા સમય સુધી બેસવું."],
  },
  {
    id: "vibandha",
    group: "Digestive Disorders",
    nameEn: "Vibandha (Constipation)",
    nameHi: "विबंध (कब्ज)",
    nameGu: "વિબંધ (કબજિયાત)",
    causesEn: ["Insufficient intake of fiber-rich foods.", "Lack of adequate water intake (dehydration).", "Sedentary lifestyle and lack of physical activity.", "Suppression of the natural urge to defecate.", "Excessive intake of dry, cold, and astringent foods.", "Chronic stress, anxiety, and irregular routines.", "Excessive consumption of tea, coffee, and alcohol.", "Certain medications."],
    causesHi: ["फाइबर युक्त खाद्य पदार्थों का अपर्याप्त सेवन।", "पर्याप्त पानी का सेवन न करना (निर्जलीकरण)।", "आलसी जीवन शैली और शारीरिक गतिविधि का अभाव।", "शौच के प्राकृतिक वेग को रोकना।", "सूखे, ठंडे और कसैले खाद्य पदार्थों का अत्यधिक सेवन।", "पुराना तनाव, चिंता और अनियमित दिनचर्या।", "चाय, कॉफी और शराब का अत्यधिक सेवन।", "कुछ दवाएं।"],
    causesGu: ["ફાઈબરયુક્ત ખોરાકનું અપૂરતું સેવન.", "પર્યાપ્ત પાણીનું સેવન ન કરવું (નિર્જલીકરણ).", "બેઠાડુ જીવનશૈલી અને શારીરિક પ્રવૃત્તિનો અભાવ.", "મળત્યાગના કુદરતી આવેગને દબાવવા.", "સૂકા, ઠંડા અને તુરા ખોરાકનું અતિશય સેવન.", "લાંબા સમયથી તણાવ, ચિંતા અને અનિયમિત દિનચર્યા.", "ચા, કોફી અને દારૂનું અતિશય સેવન.", "ચોક્કસ દવાઓ."],
    pathyaEn: ["Grains: Whole grains like wheat, barley, oats, brown rice (high in fiber).", "Pulses: Moong dal, masoor dal, cooked legumes (ensure proper cooking to avoid gas).", "Vegetables: Green leafy vegetables (spinach, fenugreek), cabbage, carrots, beetroot, pumpkin, bottle gourd, ridge gourd, okra, elephant foot yam (suran).", "Fruits: Ripe papaya, figs, apples, pears, oranges, grapes, prunes, soaked raisins.", "Spices & Herbs: Triphala powder (at night with warm water), ajwain, fennel, cumin, ginger, asafoetida (hing), rock salt.", "Dairy: Warm cow's milk (at night), ghee (in moderation).", "Oils: Ghee, castor oil (under supervision, for acute cases), olive oil.", "Practical Tips: Increase fluid intake (warm water, herbal teas). Consume plenty of fiber-rich foods. Establish a regular bowel routine. Engage in regular physical activity (walking, yoga). Avoid suppressing natural urges. Consume freshly prepared, warm meals. Soak dried fruits overnight before consumption."],
    pathyaHi: ["अनाज: साबुत अनाज जैसे गेहूं, जौ, ओट्स, ब्राउन राइस (फाइबर से भरपूर)।", "दालें: मूंग दाल, मसूर दाल, पकी हुई फलियां (गैस से बचने के लिए उचित रूप से पकाएं)।", "सब्जियां: हरी पत्तेदार सब्जियां (पालक, मेथी), पत्ता गोभी, गाजर, चुकंदर, कद्दू, लौकी, तोरई, भिंडी, सूरन।", "फल: पका पपीता, अंजीर, सेब, नाशपाती, संतरे, अंगूर, प्रून, भीगी हुई किशमिश।", "मसाले और जड़ी-बूटियाँ: त्रिफला चूर्ण (रात में गर्म पानी के साथ), अजवाइन, सौंफ, जीरा, अदरक, हींग, सेंधा नमक।", "डेयरी: गर्म गाय का दूध (रात में), घी (मध्यम मात्रा में)।", "तेल: घी, अरंडी का तेल (पर्यवेक्षण में, तीव्र मामलों के लिए), जैतून का तेल।", "व्यावहारिक सुझाव: तरल पदार्थ का सेवन बढ़ाएं (गर्म पानी, हर्बल चाय)। फाइबर युक्त खाद्य पदार्थों का खूब सेवन करें। नियमित शौच की दिनचर्या स्थापित करें। नियमित शारीरिक गतिविधि (चलना, योग) करें। प्राकृतिक वेगों को रोकने से बचें। ताजा बना, गर्म भोजन का सेवन करें। सूखे मेवों को रात भर भिगोकर रखें।"],
    pathyaGu: ["અનાજ: આખા અનાજ જેમ કે ઘઉં, જવ, ઓટ્સ, બ્રાઉન રાઈસ (ફાઈબરમાં ઉચ્ચ).", "दાળો: મગની દાળ, મસૂર દાળ, રાંધેલા કઠોળ (ગેસ ટાળવા માટે યોગ્ય રીતે રાંધો).", "શાકભાજી: લીલા પાંદડાવાળી શાકભાજી (પાલક, મેથી), કોબીજ, ગાજર, બીટરૂટ, કોળું, દૂધી, તુરિયા, ભીંડો, સુરન.", "ફળો: પાકું પપૈયું, અંજીર, સફરજન, નાશપતી, નારંગી, દ્રાક્ષ, સૂકા પ્લમ, પલાળેલી કિસમિસ.", "મસાલા અને ઔષધિઓ: ત્રિફળા ચૂર્ણ (રાત્રે ગરમ પાણી સાથે), અજમો, વરિયાળી, જીરું, આદુ, હિંગ, સિંધવ મીઠું.", "ડેરી: ગરમ ગાયનું દૂધ (રાત્રે), ઘી (મધ્યમ માત્રામાં).", "તેલ: ઘી, એરંડિયું તેલ (નિરીક્ષણ હેઠળ, તીવ્ર કિસ્સાઓ માટે), ઓલિવ તેલ.", "વ્યવહારુ ટિપ્સ: પ્રવાહીનું સેવન વધારો (ગરમ પાણી, હર્બલ ટી). પુષ્કળ ફાઈબરયુક્ત ખોરાકનું સેવન કરો. નિયમિત મળત્યાગની દિનચર્યા સ્થાપિત કરો. નિયમિત શારીરિક પ્રવૃત્તિ (ચાલવું, યોગ) કરો. કુદરતી આવેગોને દબાવવાનું ટાળો. તાજા તૈયાર કરેલા, ગરમ ભોજન લો. સૂકા મેવાને રાતભર પલાળી રાખો."],
    apathyaEn: ["Dry, cold, heavy, and astringent foods (e.g., processed foods, junk food, excessive curd).", "Refined flour products (maida) like white bread, pastries, biscuits.", "Foods with low fiber content.", "Excessive intake of meat, cheese, and heavy dairy products.", "Cold water, chilled beverages, ice cream.", "Tea, coffee, and alcohol (can be dehydrating).", "Suppression of the natural urge to defecate.", "Irregular eating habits, eating very quickly."],
    apathyaHi: ["सूखे, ठंडे, भारी और कसैले खाद्य पदार्थ (जैसे प्रसंस्कृत खाद्य पदार्थ, जंक फूड, अत्यधिक दही)।", "मैदा/परिष्कृत आटा उत्पाद जैसे सफेद ब्रेड, पेस्ट्री, बिस्कुट।", "कम फाइबर वाले खाद्य पदार्थ।", "मांस, पनीर और भारी डेयरी उत्पादों का अत्यधिक सेवन।", "ठंडा पानी, ठंडे पेय, आइसक्रीम।", "चाय, कॉफी और शराब (निर्जलीकरण कर सकते हैं)।", "शौच के प्राकृतिक वेग को रोकना।", "अनियमित खाने की आदतें, बहुत जल्दी खाना।"],
    apathyaGu: ["સૂકા, ઠંડા, ભારે અને તુરા ખોરાક (જેમ કે પ્રોસેસ્ડ ફૂડ, જંક ફૂડ, અતિશય દહીં).", "રિફાઇન્ડ લોટના ઉત્પાદનો (મેંદા) જેમ કે સફેદ બ્રેડ, પેસ્ટ્રીઝ, બિસ્કિટ.", "ઓછા ફાઈબરવાળા ખોરાક.", "માંસ, ચીઝ અને ભારે ડેરી ઉત્પાદનોનું અતિશય સેવન.", "ઠંડુ પાણી, ઠંડા પીણાં, આઈસ્ક્રીમ.", "ચા, કોફી અને દારૂ (નિર્જલીકરણ કરી શકે છે).", "મળત્યાગના કુદરતી આવેગને દબાવવા.", "અનિયમિત ખાવાની ટેવો, ખૂબ ઝડપથી ખાવું."],
  },
  {
    id: "adhmana",
    group: "Digestive Disorders",
    nameEn: "Adhmana (Gas / Bloating)",
    nameHi: "आध्मान (गैस / पेट फूलना)",
    nameGu: "આધ્માન (ગેસ / પેટ ફૂલવું)",
    causesEn: ["Weak digestive fire (Agnimandya) leading to improper digestion.", "Consumption of heavy, cold, and dry foods.", "Eating incompatible food combinations.", "Eating too quickly or talking while eating, leading to air swallowing.", "Overeating or eating before the previous meal is digested.", "Suppression of natural urges (flatus, defecation).", "Sedentary lifestyle.", "Mental stress and anxiety."],
    causesHi: ["कमजोर पाचन अग्नि (अग्निमांद्य) जिसके कारण अनुचित पाचन होता है।", "भारी, ठंडे और सूखे खाद्य पदार्थों का सेवन।", "असंगत खाद्य संयोजनों का सेवन।", "बहुत जल्दी खाना या खाते समय बात करना, जिससे हवा निगल ली जाती है।", "अधिक खाना या पहले भोजन के पचने से पहले भोजन करना।", "प्राकृतिक वेगों (गैस, शौच) को रोकना।", "आलसी जीवन शैली।", "मानसिक तनाव और चिंता।"],
    causesGu: ["નબળી પાચન અગ્નિ (અગ્નિમાંદ્ય) જેના કારણે અયોગ્ય પાચન થાય છે.", "ભારે, ઠંડા અને સૂકા ખોરાકનું સેવન.", "અસંગત ખોરાક સંયોજનોનું સેવન.", "ખૂબ ઝડપથી ખાવું અથવા ખાતી વખતે વાત કરવી, જેનાથી હવા ગળી જવાય છે.", "વધુ ખાવું અથવા અગાઉનું ભોજન પચ્યા પહેલાં ભોજન કરવું.", "કુદરતી આવેગોને દબાવવા (વાયુ, મળત્યાગ).", "બેઠાડુ જીવનશૈલી.", "માનસિક તણાવ અને ચિંતા."],
    pathyaEn: ["Grains: Old rice, barley, wheat (in easily digestible forms like thin rotis or gruel).", "Pulses: Moong dal (green gram) soup.", "Vegetables: Bottle gourd, ridge gourd, pumpkin, zucchini, carrots, spinach (cooked), fenugreek leaves (methi). Cooked with digestive spices.", "Fruits: Ripe papaya, pomegranate, apple (cooked), figs.", "Spices & Herbs: Asafoetida (hing), ajwain (carom seeds), ginger (fresh and dried), cumin, coriander, black pepper, rock salt, garlic (in small amounts).", "Dairy: Buttermilk (chhaas) with a pinch of black salt and ajwain.", "Oils: Ghee (in small amounts, if tolerated).", "Practical Tips: Eat warm, freshly prepared, and easily digestible meals. Chew food thoroughly and eat slowly. Avoid talking while eating. Drink warm water throughout the day. Include digestive spices in cooking. Avoid overeating and eating when not hungry. Practice light yoga or walking after meals. Use fennel seeds (saunf) after meals."],
    pathyaHi: ["अनाज: पुराने चावल, जौ, गेहूं (पतली रोटी या दलिया जैसे आसानी से पचने वाले रूप में)।", "दालें: मूंग दाल का सूप।", "सब्जियां: लौकी, तोरई, कद्दू, तोरी, गाजर, पालक (पका हुआ), मेथी के पत्ते। पाचक मसालों के साथ पकाएं।", "फल: पका पपीता, अनार, सेब (पका हुआ), अंजीर।", "मसाले और जड़ी-बूटियाँ: हींग, अजवाइन, अदरक (ताजा और सूखा), जीरा, धनिया, काली मिर्च, सेंधा नमक, लहसुन (कम मात्रा में)।", "डेयरी: छाछ (एक चुटकी काला नमक और अजवाइन के साथ)।", "तेल: घी (कम मात्रा में, यदि सहन हो)।", "व्यावहारिक सुझाव: गर्म, ताजा बना और आसानी से पचने वाला भोजन करें। भोजन को अच्छी तरह चबाएं और धीरे-धीरे खाएं। खाते समय बात करने से बचें। दिन भर गर्म पानी पिएं। खाना पकाने में पाचक मसालों का प्रयोग करें। अधिक खाने और भूख न लगने पर खाने से बचें। भोजन के बाद हल्का योग या चलना करें। भोजन के बाद सौंफ का सेवन करें।"],
    pathyaGu: ["અનાજ: જૂના ચોખા, જવ, ઘઉં (પાતળી રોટલી કે દલિયા જેવા સરળતાથી પચી શકે તેવા સ્વરૂપમાં).", "દાળો: મગની દાળનો સૂપ.", "શાકભાજી: દૂધી, તુરિયા, કોળું, ઝુચીની, ગાજર, પાલક (રાંધેલું), મેથીના પાન. પાચક મસાલા સાથે રાંધો.", "ફળો: પાકું પપૈયું, દાડમ, સફરજન (રાંધેલું), અંજીર.", "મસાલા અને ઔષધિઓ: હિંગ, અજમો, આદુ (તાજુ અને સૂકું), જીરું, ધાણા, કાળા મરી, સિંધવ મીઠું, લસણ (ઓછી માત્રામાં).", "ડેરી: છાશ (ચપટી કાળું મીઠું અને અજમા સાથે).", "તેલ: ઘી (ઓછી માત્રામાં, જો સહન થાય તો).", "વ્યવહારુ ટિપ્સ: ગરમ, તાજા તૈયાર કરેલા અને સરળતાથી પચી શકે તેવા ભોજન લો. ખોરાકને સારી રીતે ચાવો અને ધીમે ધીમે ખાઓ. ખાતી વખતે વાત કરવાનું ટાળો. દિવસભર ગરમ પાણી પીવો. રસોઈમાં પાચક મસાલાનો ઉપયોગ કરો. વધુ ખાવાનું અને ભૂખ ન લાગી હોય ત્યારે ખાવાનું ટાળો. ભોજન પછી હળવો યોગ અથવા ચાલવું કરો. ભોજન પછી વરિયાળીના દાણા (સાઉંફ) નો ઉપયોગ કરો."],
    apathyaEn: ["Heavy, cold, dry, and gas-forming foods (e.g., raw salads, cabbage, cauliflower, peas, beans).", "Incompatible food combinations.", "Pulses like urad dal, chana, rajma (can cause bloating).", "Processed foods, junk food, carbonated drinks.", "Excessive intake of fermented foods, yeast-containing products (bread).", "Cold water, chilled beverages, ice cream.", "Overeating, eating too quickly, or eating irregularly.", "Suppression of natural urges (flatus).", "Sleeping immediately after meals."],
    apathyaHi: ["भारी, ठंडे, सूखे और गैस बनाने वाले खाद्य पदार्थ (जैसे कच्चे सलाद, पत्ता गोभी, फूलगोभी, मटर, दालें)।", "असंगत खाद्य संयोजन।", "उड़द दाल, चना, राजमा जैसी दालें (पेट फूलना पैदा कर सकती हैं)।", "प्रसंस्कृत खाद्य पदार्थ, जंक फूड, कार्बोनेटेड पेय।", "किण्वित खाद्य पदार्थों, खमीर युक्त उत्पादों (ब्रेड) का अत्यधिक सेवन।", "ठंडा पानी, ठंडे पेय, आइसक्रीम।", "अधिक खाना, बहुत जल्दी खाना, या अनियमित रूप से खाना।", "प्राकृतिक वेगों (गैस) को रोकना।", "भोजन के तुरंत बाद सोना।"],
    apathyaGu: ["ભારે, ઠંડા, સૂકા અને ગેસ કરતા ખોરાક (જેમ કે કાચા સલાડ, કોબીજ, ફ્લાવર, વટાણા, કઠોળ).", "અસંગત ખોરાક સંયોજનો.", "અડદ દાળ, ચણા, રાજમા જેવી દાળો (પેટ ફૂલવાનું કારણ બની શકે છે).", "પ્રોસેસ્ડ ફૂડ, જંક ફૂડ, કાર્બોનેટેડ પીણાં.", "આથાવાળા ખોરાક, યીસ્ટયુક્ત ઉત્પાદનો (બ્રેડ) નું અતિશય સેવન.", "ઠંડુ પાણી, ઠંડા પીણાં, આઈસ્ક્રીમ.", "વધુ ખાવું, ખૂબ ઝડપથી ખાવું, અથવા અનિયમિત રીતે ખાવું.", "કુદરતી આવેગોને દબાવવા (વાયુ).", "ભોજન પછી તરત જ સૂવું."],
  },
  {
    id: "chhardi",
    group: "Digestive Disorders",
    nameEn: "Chhardi (Vomiting)",
    nameHi: "छर्दी (उल्टी)",
    nameGu: "છર્દી (ઉલટી)",
    causesEn: ["Excessive intake of unhygienic, heavy, oily, or incompatible foods.", "Overeating or eating before the previous meal is digested.", "Consumption of excessively spicy, sour, or salty foods.", "Suppression of natural urges (especially vomiting itself).", "Weak digestive fire (Agni).", "Emotional factors like fear, grief, disgust.", "Travel sickness.", "Underlying systemic diseases or infections."],
    causesHi: ["अस्वास्थ्यकर, भारी, तैलीय या असंगत खाद्य पदार्थों का अत्यधिक सेवन।", "अधिक खाना या पहले भोजन के पचने से पहले भोजन करना।", "अत्यधिक मसालेदार, खट्टे या नमकीन खाद्य पदार्थों का सेवन।", "प्राकृतिक वेगों को रोकना (विशेषकर उल्टी को ही)।", "कमजोर पाचन अग्नि (अग्नि)।", "डर, दुःख, घृणा जैसे भावनात्मक कारक।", "यात्रा के दौरान होने वाली बेचैनी (मोशन सिकनेस)।", "अंतर्निहित प्रणालीगत रोग या संक्रमण।"],
    causesGu: ["અસ્વચ્છ, ભારે, તેલયુક્ત અથવા અસંગત ખોરાકનું અતિશય સેવન.", "વધુ ખાવું અથવા અગાઉનું ભોજન પચ્યા પહેલાં ભોજન કરવું.", "અતિશય મસાલેદાર, ખાટા અથવા ખારા ખોરાકનું સેવન.", "કુદરતી આવેગોને દબાવવા (ખાસ કરીને ઉલટીને જ).", "નબળી પાચન અગ્નિ (અગ્નિ).", "ભય, શોક, અણગમો જેવા ભાવનાત્મક પરિબળો.", "પ્રવાસ દરમિયાન થતી બીમારી.", "અંતર્ગત પ્રણાલીગત રોગો અથવા ચેપ."],
    pathyaEn: ["Grains: Old rice (parboiled), puffed rice (murmura), rice gruel.", "Pulses: Moong dal soup (very light).", "Vegetables: Bottle gourd, ridge gourd, pumpkin, boiled potatoes (in small amounts if tolerated).", "Fruits: Pomegranate juice, grapes (sweet), apple sauce.", "Spices & Herbs: Dried ginger powder (shunthi), cardamom, clove, mint, lemon juice (in small amounts).", "Drinks: Warm water (sips), ginger water, mint tea, rice gruel, lemon water with honey (after vomiting subsides).", "Practical Tips: Initial fasting (langhanam) or very light diet. Sip warm water frequently. Avoid strong smells. Eat small, frequent, and bland meals. Avoid overeating. Rest adequately. Do not suppress the urge to vomit if it is natural. Once vomiting subsides, gradually introduce light, easily digestible foods."],
    pathyaHi: ["अनाज: पुराने चावल (उबले हुए), मुरमुरे, चावल की कांजी।", "दालें: मूंग दाल का सूप (बहुत हल्का)।", "सब्जियां: लौकी, तोरई, कद्दू, उबले आलू (यदि सहन हो तो कम मात्रा में)।", "फल: अनार का रस, अंगूर (मीठे), सेब का सॉस।", "मसाले और जड़ी-बूटियाँ: सूखी अदरक पाउडर (शुंठी), इलायची, लौंग, पुदीना, नींबू का रस (कम मात्रा में)।", "पेय: गर्म पानी (घूंट-घूंट), अदरक का पानी, पुदीना चाय, चावल की कांजी, नींबू पानी शहद के साथ (उल्टी कम होने के बाद)।", "व्यावहारिक सुझाव: शुरू में उपवास (लंघन) या बहुत हल्का आहार। बार-बार गर्म पानी पिएं। तेज गंध से बचें। छोटे, बार-बार और सादे भोजन करें। अधिक खाने से बचें। पर्याप्त आराम करें। यदि उल्टी का वेग स्वाभाविक हो तो उसे न रोकें। उल्टी कम होने के बाद, धीरे-धीरे हल्का, आसानी से पचने वाला भोजन शुरू करें।"],
    pathyaGu: ["અનાજ: જૂના ચોખા (બાફેલા), મમરા, ચોખાની કાંજી.", "દાળો: મગની દાળનો સૂપ (ખૂબ હળવો).", "શાકભાજી: દૂધી, તુરિયા, કોળું, બાફેલા બટાકા (જો સહન થાય તો ઓછી માત્રામાં).", "ફળો: દાડમનો રસ, દ્રાક્ષ (મીઠી), સફરજનનો સોસ.", "મસાલા અને ઔષધિઓ: સૂંઠ પાવડર (શુન્થી), એલચી, લવિંગ, ફુદીનો, લીંબુનો રસ (ઓછી માત્રામાં).", "પીણાં: ગરમ પાણી (ચુસ્કી), આદુનું પાણી, ફુદીનાની ચા, ચોખાની કાંજી, મધ સાથે લીંબુ પાણી (ઉલટી ઓછી થયા પછી).", "વ્યવહારુ ટિપ્સ: શરૂઆતમાં ઉપવાસ (લંઘન) અથવા ખૂબ હળવો આહાર. વારંવાર ગરમ પાણી પીવો. તીવ્ર ગંધ ટાળો. નાના, વારંવાર અને સાદા ભોજન લો. વધુ ખાવાનું ટાળો. પૂરતો આરામ કરો. જો ઉલટીનો વેગ સ્વાભાવિક હોય તો તેને દબાવશો નહીં. ઉલટી ઓછી થયા પછી, ધીમે ધીમે હળવા, સરળતાથી પચી શકે તેવા ખોરાકનો પરિચય આપો."],
    apathyaEn: ["Heavy, oily, fried, and spicy foods.", "Sour, fermented, and incompatible foods.", "Milk and milk products (except in very specific cases or as advised).", "Cold water and chilled beverages.", "Processed foods, junk food, and artificial sweeteners.", "Meat, fish, eggs.", "Overeating, eating too quickly, or eating when not hungry.", "Strong smelling foods.", "Alcohol and caffeine."],
    apathyaHi: ["भारी, तैलीय, तले हुए और मसालेदार खाद्य पदार्थ।", "खट्टे, किण्वित और असंगत खाद्य पदार्थ।", "दूध और दूध उत्पाद (बहुत विशिष्ट मामलों को छोड़कर या सलाह के अनुसार)।", "ठंडा पानी और ठंडे पेय।", "प्रसंस्कृत खाद्य पदार्थ, जंक फूड और कृत्रिम मिठास।", "मांस, मछली, अंडे।", "अधिक खाना, बहुत जल्दी खाना, या भूख न लगने पर खाना।", "तेज गंध वाले खाद्य पदार्थ।", "शराब और कैफीन।"],
    apathyaGu: ["ભારે, તેલયુક્ત, તળેલા અને મસાલેદાર ખોરાક.", "ખાટા, આથાવાળા અને અસંગત ખોરાક.", "દૂધ અને દૂધના ઉત્પાદનો (ખૂબ જ ચોક્કસ કિસ્સાઓમાં અથવા સલાહ મુજબ સિવાય).", "ઠંડુ પાણી અને ઠંડા પીણાં.", "પ્રોસેસ્ડ ફૂડ, જંક ફૂડ અને કૃત્રિમ સ્વીટનર્સ.", "માંસ, માછલી, ઇંડા.", "વધુ ખાવું, ખૂબ ઝડપથી ખાવું, અથવા ભૂખ ન લાગી હોય ત્યારે ખાવું.", "તીવ્ર ગંધવાળા ખોરાક.", "દારૂ અને કેફીન."],
  },
  {
    id: "krimi",
    group: "Digestive Disorders",
    nameEn: "Krimi (Intestinal Worms)",
    nameHi: "कृमि (आंतों के कीड़े)",
    nameGu: "ક્રિમિ (આંતરડાના કૃમિ)",
    causesEn: ["Consumption of unhygienic, uncooked, or contaminated food and water.", "Eating sweet, sour, and heavy foods in excess.", "Poor personal hygiene (e.g., not washing hands properly).", "Consuming incompatible food combinations.", "Weak digestive fire (Agni) leading to formation of Ama (toxins).", "Eating soil (in children)."],
    causesHi: ["अस्वास्थ्यकर, बिना पका हुआ या दूषित भोजन और पानी का सेवन।", "मीठे, खट्टे और भारी खाद्य पदार्थों का अत्यधिक सेवन।", "खराब व्यक्तिगत स्वच्छता (जैसे हाथों को ठीक से न धोना)।", "असंगत खाद्य संयोजनों का सेवन।", "कमजोर पाचन अग्नि (अग्नि) जिसके कारण आम (विषाक्त पदार्थ) का निर्माण होता है।", "मिट्टी खाना (बच्चों में)।"],
    causesGu: ["અસ્વચ્છ, રાંધ્યા વગરનો અથવા દૂષિત ખોરાક અને પાણીનું સેવન.", "મીઠા, ખાટા અને ભારે ખોરાકનું અતિશય સેવન.", "ખરાબ વ્યક્તિગત સ્વચ્છતા (જેમ કે હાથ યોગ્ય રીતે ન ધોવા).", "અસંગત ખોરાક સંયોજનોનું સેવન.", "નબળી પાચન અગ્નિ (અગ્નિ) જેના કારણે આમ (ઝેર) નું નિર્માણ થાય છે.", "માટી ખાવી (બાળકોમાં)."],
    pathyaEn: ["Grains: Old rice, barley, wheat (lightly prepared).", "Pulses: Moong dal, horse gram (kulthi).", "Vegetables: Bitter gourd, drumsticks, garlic, onion, pumpkin, carrots, green leafy vegetables (cooked).", "Fruits: Papaya, pomegranate, apple (with skin), figs.", "Spices & Herbs: Turmeric (haldi), asafoetida (hing), black pepper, long pepper (pippali), garlic, onion, neem leaves, vidanga (Embelia ribes - under supervision).", "Oils: Ghee (in moderation with digestive spices).", "Practical Tips: Maintain excellent personal hygiene (wash hands before eating and after using the toilet). Eat warm, freshly cooked food. Avoid raw or uncooked foods. Drink boiled and filtered water. Include pungent, bitter, and astringent tastes in the diet. Consume light and easily digestible meals. Regular physical activity. Keep nails short and clean."],
    pathyaHi: ["अनाज: पुराने चावल, जौ, गेहूं (हल्के ढंग से तैयार)।", "दालें: मूंग दाल, कुलथी (कुलथी)।", "सब्जियां: करेला, सहजन, लहसुन, प्याज, कद्दू, गाजर, हरी पत्तेदार सब्जियां (पकी हुई)।", "फल: पपीता, अनार, सेब (छिलके सहित), अंजीर।", "मसाले और जड़ी-बूटियाँ: हल्दी, हींग, काली मिर्च, पिप्पली, लहसुन, प्याज, नीम के पत्ते, विडंग (एमबेलिया रिब्स - पर्यवेक्षण के तहत)।", "तेल: घी (पाचक मसालों के साथ मध्यम मात्रा में)।", "व्यावहारिक सुझाव: उत्कृष्ट व्यक्तिगत स्वच्छता बनाए रखें (खाने से पहले और शौचालय का उपयोग करने के बाद हाथ धोएं)। गर्म, ताजा पका भोजन करें। कच्चे या अधपके खाद्य पदार्थों से बचें। उबला हुआ और फ़िल्टर्ड पानी पिएं। आहार में तीखे, कड़वे और कसैले स्वाद शामिल करें। हल्का और आसानी से पचने वाला भोजन करें। नियमित शारीरिक गतिविधि। नाखूनों को छोटा और साफ रखें।"],
    pathyaGu: ["અનાજ: જૂના ચોખા, જવ, ઘઉં (હળવા તૈયાર કરેલા).", "દાળો: મગની દાળ, કુળથી (કુલથી).", "શાકભાજી: કારેલા, સરગવો, લસણ, ડુંગળી, કોળું, ગાજર, લીલા પાંદડાવાળી શાકભાજી (રાંધેલી).", "ફળો: પપૈયું, દાડમ, સફરજન (છાલ સાથે), અંજીર.", "મસાલા અને ઔષધિઓ: હળદર, હિંગ, કાળા મરી, પીપળી, લસણ, ડુંગળી, લીમડાના પાન, વિડંગ (એમ્બેલિયા રીબ્સ - દેખરેખ હેઠળ).", "તેલ: ઘી (પાચક મસાલા સાથે મધ્યમ માત્રામાં).", "વ્યવહારુ ટિપ્સ: ઉત્તમ વ્યક્તિગત સ્વચ્છતા જાળવો (ખાતા પહેલા અને શૌચાલયનો ઉપયોગ કર્યા પછી હાથ ધોવા). ગરમ, તાજા રાંધેલા ખોરાક લો. કાચા અથવા અધૂરા રાંધેલા ખોરાક ટાળો. ઉકાળેલું અને ફિલ્ટર કરેલું પાણી પીવો. આહારમાં તીખા, કડવા અને તુરા સ્વાદનો સમાવેશ કરો. હળવા અને સરળતાથી પચી શકે તેવા ભોજન લો. નિયમિત શારીરિક પ્રવૃત્તિ. નખ ટૂંકા અને સ્વચ્છ રાખો."],
    apathyaEn: ["Sweet, sour, heavy, and cold foods.", "Uncooked or raw foods (especially meat, fish).", "Contaminated food and water.", "Refined flour products (maida), bakery items.", "Jaggery, excessive sweets, and dairy products.", "Incompatible food combinations.", "Sedentary lifestyle.", "Poor hygiene practices."],
    apathyaHi: ["मीठे, खट्टे, भारी और ठंडे खाद्य पदार्थ।", "कच्चे या बिना पके खाद्य पदार्थ (विशेषकर मांस, मछली)।", "दूषित भोजन और पानी।", "परिष्कृत आटा उत्पाद (मैदा), बेकरी आइटम।", "गुड़, अत्यधिक मिठाई और डेयरी उत्पाद।", "असंगत खाद्य संयोजन।", "आलसी जीवन शैली।", "खराब स्वच्छता प्रथाएं।"],
    apathyaGu: ["મીઠા, ખાટા, ભારે અને ઠંડા ખોરાક.", "રાંધ્યા વગરના અથવા કાચા ખોરાક (ખાસ કરીને માંસ, માછલી).", "દૂષિત ખોરાક અને પાણી.", "રિફાઇન્ડ લોટના ઉત્પાદનો (મેંદા), બેકરી વસ્તુઓ.", "ગોળ, અતિશય મીઠાઈઓ અને ડેરી ઉત્પાદનો.", "અસંગત ખોરાક સંયોજનો.", "બેઠાડુ જીવનશૈલી.", "ખરાબ સ્વચ્છતા પ્રથાઓ."],
  },
  {
    id: "udarashoola",
    group: "Digestive Disorders",
    nameEn: "Udarashoola (Abdominal Pain)",
    nameHi: "उदरशूल (पेट दर्द)",
    nameGu: "ઉદરશૂલ (પેટનો દુખાવો)",
    causesEn: ["Weak digestive fire (Agnimandya) and improper digestion (Ajirna).", "Excessive intake of dry, cold, heavy, or gas-forming foods.", "Eating incompatible food combinations.", "Suppression of natural urges (flatus, defecation, urination).", "Exposure to cold environment or cold water.", "Mental stress, anxiety, and emotional disturbances.", "Intestinal worms (Krimi).", "Underlying digestive disorders like Grahani, Atisara, Vibandha."],
    causesHi: ["कमजोर पाचन अग्नि (अग्निमांद्य) और अनुचित पाचन (अजीर्ण)।", "सूखे, ठंडे, भारी या गैस बनाने वाले खाद्य पदार्थों का अत्यधिक सेवन।", "असंगत खाद्य संयोजनों का सेवन।", "प्राकृतिक वेगों (गैस, शौच, पेशाब) को रोकना।", "ठंडे वातावरण या ठंडे पानी के संपर्क में आना।", "मानसिक तनाव, चिंता और भावनात्मक परेशानियां।", "आंतों के कीड़े (कृमि)।", "ग्रहणी, अतिसार, विबंध जैसे अंतर्निहित पाचन विकार।"],
    causesGu: ["નબળી પાચન અગ્નિ (અગ્નિમાંદ્ય) અને અયોગ્ય પાચન (અજીર્ણ).", "સૂકા, ઠંડા, ભારે અથવા ગેસ કરતા ખોરાકનું અતિશય સેવન.", "અસંગત ખોરાક સંયોજનોનું સેવન.", "કુદરતી આવેગોને દબાવવા (વાયુ, મળત્યાગ, પેશાબ).", "ઠંડા વાતાવરણ અથવા ઠંડા પાણીના સંપર્કમાં આવવું.", "માનસિક તણાવ, ચિંતા અને ભાવનાત્મક વિક્ષેપો.", "આંતરડાના કૃમિ (ક્રિમિ).", "ગ્રહણી, અતિસાર, વિબંધ જેવા અંતર્ગત પાચન વિકારો."],
    pathyaEn: ["Grains: Old rice, barley, wheat (in very light, easily digestible forms like gruel or thin chapati).", "Pulses: Moong dal (green gram) soup.", "Vegetables: Bottle gourd, ridge gourd, pumpkin, carrots, spinach (cooked), fenugreek leaves (methi). Cooked with digestive spices like ginger and asafoetida.", "Fruits: Ripe papaya, pomegranate, apple (cooked).", "Spices & Herbs: Ginger (fresh and dried), asafoetida (hing), ajwain (carom seeds), cumin, coriander, black pepper, rock salt, garlic.", "Drinks: Warm water, ginger tea, ajwain water, herbal teas.", "Practical Tips: Eat warm, freshly prepared, and easily digestible food. Chew food thoroughly. Avoid overeating. Drink warm water throughout the day. Apply warmth to the abdomen (e.g., hot water bag). Rest adequately. Avoid exposure to cold. Practice light breathing exercises or gentle yoga poses. Consult a physician to identify and treat the underlying cause."],
    pathyaHi: ["अनाज: पुराने चावल, जौ, गेहूं (दलिया या पतली चपाती जैसे बहुत हल्के, आसानी से पचने वाले रूप में)।", "दालें: मूंग दाल का सूप।", "सब्जियां: लौकी, तोरई, कद्दू, गाजर, पालक (पका हुआ), मेथी के पत्ते। अदरक और हींग जैसे पाचक मसालों के साथ पकाएं।", "फल: पका पपीता, अनार, सेब (पका हुआ)।", "मसाले और जड़ी-बूटियाँ: अदरक (ताजा और सूखा), हींग, अजवाइन, जीरा, धनिया, काली मिर्च, सेंधा नमक, लहसुन।", "पेय: गर्म पानी, अदरक की चाय, अजवाइन का पानी, हर्बल चाय।", "व्यावहारिक सुझाव: गर्म, ताजा बना और आसानी से पचने वाला भोजन करें। भोजन को अच्छी तरह चबाएं। अधिक खाने से बचें। दिन भर गर्म पानी पिएं। पेट पर गर्मी लगाएं (जैसे गर्म पानी की बोतल)। पर्याप्त आराम करें। ठंड के संपर्क से बचें। हल्के श्वास व्यायाम या कोमल योग आसन का अभ्यास करें। अंतर्निहित कारण की पहचान और उपचार के लिए चिकित्सक से परामर्श करें।"],
    pathyaGu: ["અનાજ: જૂના ચોખા, જવ, ઘઉં (દલિયા કે પાતળી રોટલી જેવા ખૂબ હળવા, સરળતાથી પચી શકે તેવા સ્વરૂપમાં).", "દાળો: મગની દાળનો સૂપ.", "શાકભાજી: દૂધી, તુરિયા, કોળું, ગાજર, પાલક (રાંધેલું), મેથીના પાન. આદુ અને હિંગ જેવા પાચક મસાલા સાથે રાંધો.", "ફળો: પાકું પપૈયું, દાડમ, સફરજન (રાંધેલું).", "મસાલા અને ઔષધિઓ: આદુ (તાજુ અને સૂકું), હિંગ, અજમો, જીરું, ધાણા, કાળા મરી, સિંધવ મીઠું, લસણ.", "પીણાં: ગરમ પાણી, આદુની ચા, અજમાનું પાણી, હર્બલ ટી.", "વ્યવહારુ ટિપ્સ: ગરમ, તાજા તૈયાર કરેલા અને સરળતાથી પચી શકે તેવા ભોજન લો. ખોરાકને સારી રીતે ચાવો. વધુ ખાવાનું ટાળો. દિવસભર ગરમ પાણી પીવો. પેટ પર ગરમી લગાવો (જેમ કે ગરમ પાણીની બોટલ). પૂરતો આરામ કરો. ઠંડીના સંપર્કથી બચો. હળવા શ્વાસના વ્યાયામ અથવા હળવા યોગાસનનો અભ્યાસ કરો. અંતર્ગત કારણની ઓળખ અને સારવાર માટે ચિકિત્સકનો સંપર્ક કરો."],
    apathyaEn: ["Heavy, cold, dry, and gas-forming foods (e.g., raw salads, cabbage, cauliflower, peas, beans, urad dal, rajma).", "Excessively spicy, sour, or astringent foods.", "Incompatible food combinations.", "Processed foods, junk food, carbonated drinks.", "Cold water, chilled beverages, ice cream.", "Tea, coffee, and alcohol.", "Overeating, irregular eating habits, eating too quickly.", "Suppression of natural urges.", "Exposure to cold, lack of rest."],
    apathyaHi: ["भारी, ठंडे, सूखे और गैस बनाने वाले खाद्य पदार्थ (जैसे कच्चे सलाद, पत्ता गोभी, फूलगोभी, मटर, दालें, उड़द दाल, राजमा)।", "अत्यधिक मसालेदार, खट्टे या कसैले खाद्य पदार्थ।", "असंगत खाद्य संयोजन।", "प्रसंस्कृत खाद्य पदार्थ, जंक फूड, कार्बोनेटेड पेय।", "ठंडा पानी, ठंडे पेय, आइसक्रीम।", "चाय, कॉफी और शराब।", "अधिक खाना, अनियमित खाने की आदतें, बहुत जल्दी खाना।", "प्राकृतिक वेगों को रोकना।", "ठंड के संपर्क में आना, आराम की कमी।"],
    apathyaGu: ["ભારે, ઠંડા, સૂકા અને ગેસ કરતા ખોરાક (જેમ કે કાચા સલાડ, કોબીજ, ફ્લાવર, વટાણા, કઠોળ, અડદ દાળ, રાજમા).", "અતિશય મસાલેદાર, ખાટા અથવા તુરા ખોરાક.", "અસંગત ખોરાક સંયોજનો.", "પ્રોસેસ્ડ ફૂડ, જંક ફૂડ, કાર્બોનેટેડ પીણાં.", "ઠંડુ પાણી, ઠંડા પીણાં, આઈસ્ક્રીમ.", "ચા, કોફી અને દારૂ.", "વધુ ખાવું, અનિયમિત ખાવાની ટેવો, ખૂબ ઝડપથી ખાવું.", "કુદરતી આવેગોને દબાવવા.", "ઠંડીના સંપર્કમાં આવવું, આરામનો અભાવ."],
  },
  {
    id: "yakrit-vikara",
    group: "Digestive Disorders",
    nameEn: "Yakrit Vikara (Liver Disorders)",
    nameHi: "यकृत विकार (यकृत रोग)",
    nameGu: "યકૃત વિકાર (યકૃત રોગ)",
    causesEn: ["Excessive intake of heavy, oily, fried, spicy, and sour foods.", "Overeating and irregular eating habits.", "Excessive consumption of alcohol.", "Exposure to toxins and environmental pollutants.", "Chronic stress, anger, and other Pitta-aggravating emotions.", "Suppression of natural urges.", "Incompatible food combinations (Viruddha Ahara).", "Viral infections (e.g., hepatitis)."],
    causesHi: ["भारी, तैलीय, तले हुए, मसालेदार और खट्टे खाद्य पदार्थों का अत्यधिक सेवन।", "अधिक खाना और अनियमित खाने की आदतें।", "शराब का अत्यधिक सेवन।", "विषाक्त पदार्थों और पर्यावरणीय प्रदूषकों के संपर्क में आना।", "पुरानी तनाव, क्रोध और अन्य पित्त-बढ़ाने वाले भाव।", "प्राकृतिक वेगों को रोकना।", "असंगत खाद्य संयोजन (विरुद्ध आहार)।", "वायरल संक्रमण (जैसे हेपेटाइटिस)।"],
    causesGu: ["ભારે, તેલયુક્ત, તળેલા, મસાલેદાર અને ખાટા ખોરાકનું અતિશય સેવન.", "વધુ ખાવું અને અનિયમિત ખાવાની ટેવો.", "દારૂનું અતિશય સેવન.", "ઝેરી પદાર્થો અને પર્યાવરણીય પ્રદૂષકોના સંપર્કમાં આવવું.", "લાંબા સમયથી તણાવ, ક્રોધ અને અન્ય પિત્ત-વધાવનારા ભાવ.", "કુદરતી આવેગોને દબાવવા.", "અસંગત ખોરાક સંયોજનો (વિરુદ્ધ આહાર).", "વાયરલ ઇન્ફેક્શન (દા.ત. હેપેટાઇટિસ)."],
    pathyaEn: ["Grains: Old rice, barley, wheat (lightly prepared), oats.", "Pulses: Moong dal, masoor dal, pigeon pea (toor dal) (lightly cooked).", "Vegetables: Bitter gourd, bottle gourd, ridge gourd, pumpkin, carrots, beetroot, spinach, fenugreek leaves, green leafy vegetables. Artichoke.", "Fruits: Pomegranate, apples, papaya, grapes, amla (Indian gooseberry), pears.", "Spices & Herbs: Turmeric, cumin, coriander, fennel, ginger (fresh, in moderation), mint, basil (tulsi).", "Drinks: Warm water, tender coconut water, buttermilk, herbal teas (e.g., dandelion, chicory).", "Practical Tips: Eat light, freshly prepared, and easily digestible meals. Avoid overeating. Maintain regular meal times. Drink plenty of warm, boiled water. Incorporate bitter and astringent tastes. Avoid alcohol completely. Manage stress through yoga, meditation, and adequate rest. Protect against infections and environmental toxins. Consume fresh juices of vegetables like beetroot, carrot, amla."],
    pathyaHi: ["अनाज: पुराने चावल, जौ, गेहूं (हल्के ढंग से तैयार), ओट्स।", "दालें: मूंग दाल, मसूर दाल, अरहर दाल (हल्की पकी हुई)।", "सब्जियां: करेला, लौकी, तोरई, कद्दू, गाजर, चुकंदर, पालक, मेथी के पत्ते, हरी पत्तेदार सब्जियां। आटिचोक।", "फल: अनार, सेब, पपीता, अंगूर, आंवला, नाशपाती।", "मसाले और जड़ी-बूटियाँ: हल्दी, जीरा, धनिया, सौंफ, अदरक (ताजा, मध्यम मात्रा में), पुदीना, तुलसी।", "पेय: गर्म पानी, नारियल का पानी, छाछ, हर्बल चाय (जैसे डेंडिलियन, चिकोरी)।", "व्यावहारिक सुझाव: हल्का, ताजा बना और आसानी से पचने वाला भोजन करें। अधिक खाने से बचें। नियमित भोजन का समय बनाए रखें। खूब गर्म, उबला हुआ पानी पिएं। कड़वे और कसैले स्वाद शामिल करें। शराब का पूरी तरह से परहेज करें। योग, ध्यान और पर्याप्त आराम के माध्यम से तनाव का प्रबंधन करें। संक्रमण और पर्यावरणीय विषाक्त पदार्थों से रक्षा करें। चुकंदर, गाजर, आंवला जैसे सब्जियों के ताजा रस का सेवन करें।"],
    pathyaGu: ["અનાજ: જૂના ચોખા, જવ, ઘઉં (હળવા તૈયાર કરેલા), ઓટ્સ.", "દાળો: મગની દાળ, મસૂર દાળ, તુવેર દાળ (હળવી રાંધેલી).", "શાકભાજી: કારેલા, દૂધી, તુરિયા, કોળું, ગાજર, બીટરૂટ, પાલક, મેથીના પાન, લીલા પાંદડાવાળી શાકભાજી. આર્ટીચોક.", "ફળો: દાડમ, સફરજન, પપૈયું, દ્રાક્ષ, આમળા, નાશપતી.", "મસાલા અને ઔષધિઓ: હળદર, જીરું, ધાણા, વરિયાળી, આદુ (તાજુ, મધ્યમ માત્રામાં), ફુદીનો, તુલસી.", "પીણાં: ગરમ પાણી, કુમળું નાળિયેર પાણી, છાશ, હર્બલ ટી (જેમ કે ડેંડિલિયન, ચીકોરી).", "વ્યવહારુ ટિપ્સ: હળવો, તાજા તૈયાર કરેલા અને સરળતાથી પચી શકે તેવા ભોજન લો. વધુ ખાવાનું ટાળો. નિયમિત ભોજનનો સમય જાળવો. પુષ્કળ ગરમ, ઉકાળેલું પાણી પીવો. કડવા અને તુરા સ્વાદનો સમાવેશ કરો. દારૂનો સંપૂર્ણપણે ત્યાગ કરો. યોગ, ધ્યાન અને પર્યાપ્ત આરામ દ્વારા તણાવનું સંચાલન કરો. ચેપ અને પર્યાવરણીય ઝેરી પદાર્થો સામે રક્ષણ કરો. બીટરૂટ, ગાજર, આમળા જેવી શાકભાજીના તાજા રસનું સેવન કરો."],
    apathyaEn: ["Heavy, oily, fried, spicy, and sour foods.", "Excessive intake of processed foods, junk food, and refined sugar.", "Alcohol and tobacco (strictly avoid).", "Fermented foods, excessive curd.", "Red meat, heavy fish, eggs (in excess).", "Incompatible food combinations.", "Suppression of natural urges.", "Irregular eating habits, overeating, or eating late at night.", "Exposure to toxins."],
    apathyaHi: ["भारी, तैलीय, तले हुए, मसालेदार और खट्टे खाद्य पदार्थ।", "प्रसंस्कृत खाद्य पदार्थों, जंक फूड और परिष्कृत चीनी का अत्यधिक सेवन।", "शराब और तंबाकू (पूरी तरह से बचें)।", "किण्वित खाद्य पदार्थ, अत्यधिक दही।", "लाल मांस, भारी मछली और अंडे (अत्यधिक मात्रा में)।", "असंगत खाद्य संयोजन।", "प्राकृतिक वेगों को रोकना।", "अनियमित खाने की आदतें, अधिक खाना, या देर रात खाना।", "विषाक्त पदार्थों के संपर्क में आना।"],
    apathyaGu: ["ભારે, તેલયુક્ત, તળેલા, મસાલેદાર અને ખાટા ખોરાક.", "પ્રોસેસેડ ફૂડ, જંક ફૂડ અને રિફાઇન્ડ ખાંડનું અતિશય સેવન.", "દારૂ અને તમાકુ (સંપૂર્ણપણે ટાળો).", "આથાવાળા ખોરાક, અતિશય દહીં.", "લાલ માંસ, ભારે માછલી અને ઇંડા (વધારે પ્રમાણમાં).", "અસંગત ખોરાક સંયોજનો.", "કુદરતી આવેગોને દબાવવા.", "અનિયમિત ખાવાની ટેવો, વધુ ખાવું, અથવા રાત્રે મોડેથી ખાવું.", "ઝેરી પદાર્થોના સંપર્કમાં આવવું."],
  },
  {
    id: "pandu",
    group: "Digestive Disorders",
    nameEn: "Pandu (Anemia)",
    nameHi: "पांडु (एनीमिया)",
    nameGu: "પાંડુ (એનિમિયા)",
    causesEn: ["Insufficient intake of iron-rich foods.", "Poor digestion and assimilation of nutrients (weak Agni).", "Excessive bleeding (e.g., heavy menstruation, hemorrhoids).", "Consuming dry, cold, and incompatible foods.", "Chronic diseases or infections.", "Mental stress and anxiety.", "Lack of physical activity or excessive physical exertion.", "Suppression of natural urges."],
    causesHi: ["आयरन युक्त खाद्य पदार्थों का अपर्याप्त सेवन।", "पोषक तत्वों का खराब पाचन और आत्मसात (कमजोर अग्नि)।", "अत्यधिक रक्तस्राव (जैसे भारी मासिक धर्म, बवासीर)।", "सूखे, ठंडे और असंगत खाद्य पदार्थों का सेवन।", "पुरानी बीमारियाँ या संक्रमण।", "मानसिक तनाव और चिंता।", "शारीरिक गतिविधि का अभाव या अत्यधिक शारीरिक श्रम।", "प्राकृतिक वेगों को रोकना।"],
    causesGu: ["લોહ તત્ત્વથી ભરપૂર ખોરાકનું અપૂરતું સેવન.", "પોષક તત્ત્વોનું નબળું પાચન અને શોષણ (નબળી અગ્નિ).", "અતિશય રક્તસ્ત્રાવ (દા.ત., ભારે માસિક સ્રાવ, હરસ).", "સૂકા, ઠંડા અને અસંગત ખોરાકનું સેવન.", "લાંબા સમયના રોગો અથવા ચેપ.", "માનસિક તણાવ અને ચિંતા.", "શારીરિક પ્રવૃત્તિનો અભાવ અથવા અતિશય શારીરિક શ્રમ.", "કુદરતી આવેગોને દબાવવા."],
    pathyaEn: ["Grains: Brown rice, whole wheat, barley, oats.", "Pulses: Moong dal, lentils, black gram (urad dal - in moderation, well-cooked), horse gram.", "Vegetables: Spinach, fenugreek leaves, beetroot, carrots, kale, drumsticks, green leafy vegetables (rich in iron and folate).", "Fruits: Pomegranate, apple, dates, figs, black grapes, amla (Indian gooseberry), banana.", "Spices & Herbs: Turmeric, cumin, coriander, ginger, black pepper, jaggery, sesame seeds (til).", "Dairy: Cow's milk, buttermilk, ghee (in moderation).", "Non-veg: Liver (if consumed), lean meat, fish (in moderation, well-cooked).", "Practical Tips: Increase intake of iron-rich foods. Combine iron-rich foods with Vitamin C (e.g., amla, lemon) for better absorption. Eat freshly prepared, warm, and easily digestible meals. Avoid overeating. Maintain regular meal times. Drink warm water throughout the day. Manage stress through relaxation techniques. Ensure adequate rest. Sun exposure (early morning) can be beneficial."],
    pathyaHi: ["अनाज: ब्राउन राइस, साबुत गेहूं, जौ, ओट्स।", "दालें: मूंग दाल, मसूर दाल, उड़द दाल (मध्यम मात्रा में, अच्छी तरह से पकी हुई), कुलथी।", "सब्जियां: पालक, मेथी के पत्ते, चुकंदर, गाजर, केल, सहजन, हरी पत्तेदार सब्जियां (आयरन और फोलेट से भरपूर)।", "फल: अनार, सेब, खजूर, अंजीर, काले अंगूर, आंवला, केला।", "मसाले और जड़ी-बूटियाँ: हल्दी, जीरा, धनिया, अदरक, काली मिर्च, गुड़, तिल।", "डेयरी: गाय का दूध, छाछ, घी (मध्यम मात्रा में)।", "नॉन-वेज: लीवर (यदि सेवन किया जाता है), लीन मांस, मछली (मध्यम मात्रा में, अच्छी तरह से पकी हुई)।", "व्यावहारिक सुझाव: आयरन युक्त खाद्य पदार्थों का सेवन बढ़ाएं। बेहतर अवशोषण के लिए आयरन युक्त खाद्य पदार्थों को विटामिन सी (जैसे आंवला, नींबू) के साथ मिलाएं। ताजा बना, गर्म और आसानी से पचने वाला भोजन करें। अधिक खाने से बचें। नियमित भोजन का समय बनाए रखें। दिन भर गर्म पानी पिएं। विश्राम तकनीकों के माध्यम से तनाव का प्रबंधन करें। पर्याप्त आराम सुनिश्चित करें। सूर्य के संपर्क में आना (सुबह जल्दी) फायदेमंद हो सकता है।"],
    pathyaGu: ["અનાજ: બ્રાઉન રાઈસ, આખા ઘઉં, જવ, ઓટ્સ.", "દાળો: મગની દાળ, મસૂર દાળ, અડદ દાળ (મધ્યમ માત્રામાં, સારી રીતે રાંધેલી), કુળથી.", "શાકભાજી: પાલક, મેથીના પાન, બીટરૂટ, ગાજર, કેળ, સરગવો, લીલા પાંદડાવાળી શાકભાજી (લોહ અને ફોલેટથી ભરપૂર).", "ફળો: દાડમ, સફરજન, ખજૂર, અંજીર, કાળા દ્રાક્ષ, આમળા, કેળું.", "મસાલા અને ઔષધિઓ: હળદર, જીરું, ધાણા, આદુ, કાળા મરી, ગોળ, તલ.", "ડેરી: ગાયનું દૂધ, છાશ, ઘી (મધ્યમ માત્રામાં).", "નોન-વેજ: લીવર (જો સેવન કરવામાં આવે તો), લીન માંસ, માછલી (મધ્યમ માત્રામાં, સારી રીતે રાંધેલી).", "વ્યવહારુ ટિપ્સ: લોહ તત્ત્વથી ભરપૂર ખોરાકનું સેવન વધારો. વધુ સારા શોષણ માટે લોહ તત્ત્વથી ભરપૂર ખોરાકને વિટામિન સી (જેમ કે આમળા, લીંબુ) સાથે જોડો. તાજા તૈયાર કરેલા, ગરમ અને સરળતાથી પચી શકે તેવા ભોજન લો. વધુ ખાવાનું ટાળો. નિયમિત ભોજનનો સમય જાળવો. દિવસભર ગરમ પાણી પીવો. રિલેક્સેશન ટેકનિક દ્વારા તણાવનું સંચાલન કરો. પૂરતો આરામ સુનિશ્ચિત કરો. સૂર્યપ્રકાશ (સવારના વહેલા) ફાયદાકારક હોઈ શકે છે."],
    apathyaEn: ["Excessive intake of dry, cold, and astringent foods.", "Foods that impair digestion or inhibit iron absorption (e.g., excessive tea, coffee, oxalates).", "Processed foods, junk food, and refined sugar.", "Incompatible food combinations.", "Heavy, oily, fried, and spicy foods.", "Suppression of natural urges.", "Lack of physical activity.", "Excessive cold exposure."],
    apathyaHi: ["सूखे, ठंडे और कसैले खाद्य पदार्थों का अत्यधिक सेवन।", "पाचन को खराब करने वाले या आयरन के अवशोषण को रोकने वाले खाद्य पदार्थ (जैसे अत्यधिक चाय, कॉफी, ऑक्सालेट)।", "प्रसंस्कृत खाद्य पदार्थ, जंक फूड और परिष्कृत चीनी।", "असंगत खाद्य संयोजन।", "भारी, तैलीय, तले हुए और मसालेदार खाद्य पदार्थ।", "प्राकृतिक वेगों को रोकना।", "शारीरिक गतिविधि का अभाव।", "अत्यधिक ठंड के संपर्क में आना।"],
    apathyaGu: ["સૂકા, ઠંડા અને તુરા ખોરાકનું અતિશય સેવન.", "પાચનને નબળું પાડતા અથવા લોહના શોષણને અવરોધતા ખોરાક (દા.ત., અતિશય ચા, કોફી, ઓક્સાલેટ્સ).", "પ્રોસેસ્ડ ફૂડ, જંક ફૂડ અને રિફાઇન્ડ ખાંડ.", "અસંગત ખોરાક સંયોજનો.", "ભારે, તેલયુક્ત, તળેલા અને મસાલેદાર ખોરાક.", "કુદરતી આવેગોને દબાવવા.", "શારીરિક પ્રવૃત્તિનો અભાવ.", "અતિશય ઠંડીના સંપર્કમાં આવવું."],
  },
  {
    id: "kamala",
    group: "Digestive Disorders",
    nameEn: "Kamala (Jaundice)",
    nameHi: "कमला (पीलिया)",
    nameGu: "કમળા (પીળીઓ)",
    causesEn: ["Excessive intake of Pitta-aggravating foods like oily, fried, spicy, sour, and heavy foods.", "Chronic liver disorders (Yakrit Vikara).", "Excessive consumption of alcohol.", "Suppression of natural urges.", "Exposure to toxins and unhygienic conditions.", "Incompatible food combinations (Viruddha Ahara).", "Anemia (Pandu) progressing to a more severe stage."],
    causesHi: ["पित्त-बढ़ाने वाले खाद्य पदार्थों जैसे तैलीय, तले हुए, मसालेदार, खट्टे और भारी खाद्य पदार्थों का अत्यधिक सेवन।", "पुरानी यकृत विकार (यकृत विकार)।", "शराब का अत्यधिक सेवन।", "प्राकृतिक वेगों को रोकना।", "विषाक्त पदार्थों और अस्वास्थ्यकर परिस्थितियों के संपर्क में आना।", "असंगत खाद्य संयोजन (विरुद्ध आहार)।", "एनीमिया (पांडु) का अधिक गंभीर अवस्था में बढ़ना।"],
    causesGu: ["પિત્ત-વધાવનારા ખોરાક જેવા કે તેલયુક્ત, તળેલા, મસાલેદાર, ખાટા અને ભારે ખોરાકનું અતિશય સેવન.", "લાંબા સમયથી યકૃત વિકાર (યકૃત રોગ).", "દારૂનું અતિશય સેવન.", "કુદરતી આવેગોને દબાવવા.", "ઝેરી પદાર્થો અને અસ્વચ્છ પરિસ્થિતિઓના સંપર્કમાં આવવું.", "અસંગત ખોરાક સંયોજનો (વિરુદ્ધ આહાર).", "એનિમિયા (પાંડુ) વધુ ગંભીર તબક્કામાં આગળ વધવું."],
    pathyaEn: ["Grains: Old rice, barley, wheat (in easily digestible forms like gruel or thin chapati).", "Pulses: Moong dal (green gram) soup.", "Vegetables: Bitter gourd, bottle gourd, ridge gourd, pumpkin, green leafy vegetables (lightly cooked).", "Fruits: Sugarcane juice (fresh), grapes, pomegranate, amla (Indian gooseberry), ripe papaya.", "Spices & Herbs: Turmeric (in very small amounts, primarily in external applications), coriander, fennel, mint, basil (tulsi).", "Drinks: Warm water, tender coconut water, buttermilk, fresh sugarcane juice, barley water.", "Practical Tips: Complete rest is crucial. Eat light, freshly prepared, and easily digestible meals. Avoid overeating and irregular meal times. Drink plenty of warm water. Avoid strong sunlight and heat. Maintain strict hygiene. Avoid alcohol completely. Incorporate bitter and sweet tastes. Consume fresh juices of vegetables like beetroot, carrot, amla. Seek medical advice for proper diagnosis and treatment."],
    pathyaHi: ["अनाज: पुराने चावल, जौ, गेहूं (दलिया या पतली चपाती जैसे आसानी से पचने वाले रूप में)।", "दालें: मूंग दाल का सूप।", "सब्जियां: करेला, लौकी, तोरई, कद्दू, हरी पत्तेदार सब्जियां (हल्की पकी हुई)।", "फल: गन्ने का रस (ताजा), अंगूर, अनार, आंवला, पका पपीता।", "मसाले और जड़ी-बूटियाँ: हल्दी (बहुत कम मात्रा में, मुख्य रूप से बाहरी अनुप्रयोगों में), धनिया, सौंफ, पुदीना, तुलसी।", "पेय: गर्म पानी, नारियल का पानी, छाछ, ताजा गन्ने का रस, जौ का पानी।", "व्यावहारिक सुझाव: पूर्ण आराम महत्वपूर्ण है। हल्का, ताजा बना और आसानी से पचने वाला भोजन करें। अधिक खाने और अनियमित भोजन के समय से बचें। खूब गर्म पानी पिएं। तेज धूप और गर्मी से बचें। सख्त स्वच्छता बनाए रखें। शराब का पूरी तरह से परहेज करें। कड़वे और मीठे स्वाद शामिल करें। मौसमी फलों और सब्जियों के ताजा रस का सेवन करें। उचित निदान और उपचार के लिए चिकित्सा सलाह लें।"],
    pathyaGu: ["અનાજ: જૂના ચોખા, જવ, ઘઉં (દલિયા કે પાતળી રોટલી જેવા સરળતાથી પચી શકે તેવા સ્વરૂપમાં).", "દાળો: મગની દાળનો સૂપ.", "શાકભાજી: કારેલા, દૂધી, તુરિયા, કોળું, લીલા પાંદડાવાળી શાકભાજી (હળવી રાંધેલી).", "ફળો: શેરડીનો રસ (તાજો), દ્રાક્ષ, દાડમ, આમળા, પાકું પપૈયું.", "મસાલા અને ઔષધિઓ: હળદર (ખૂબ ઓછી માત્રામાં, મુખ્યત્વે બાહ્ય ઉપયોગમાં), ધાણા, વરિયાળી, ફુદીનો, તુલસી.", "પીણાં: ગરમ પાણી, કુમળું નાળિયેર પાણી, છાશ, તાજો શેરડીનો રસ, જવનું પાણી.", "વ્યવહારુ ટિપ્સ: સંપૂર્ણ આરામ અત્યંત મહત્વપૂર્ણ છે. હળવો, તાજા તૈયાર કરેલા અને સરળતાથી પચી શકે તેવા ભોજન લો. વધુ ખાવાનું અને અનિયમિત ભોજનનો સમય ટાળો. પુષ્કળ ગરમ પાણી પીવો. તીવ્ર સૂર્યપ્રકાશ અને ગરમીથી બચો. કડક સ્વચ્છતા જાળવો. દારૂનો સંપૂર્ણપણે ત્યાગ કરો. કડવા અને મીઠા સ્વાદનો સમાવેશ કરો. મોસમી ફળો અને શાકભાજીના તાજા રસનું સેવન કરો. યોગ્ય નિદાન અને સારવાર માટે તબીબી સલાહ લો."],
    apathyaEn: ["Heavy, oily, fried, spicy, and sour foods.", "Excessive intake of processed foods, junk food, and refined sugar.", "Alcohol and tobacco (strictly avoid).", "Fermented foods, excessive curd, and cheese.", "Red meat, heavy fish, eggs.", "Incompatible food combinations.", "Suppression of natural urges.", "Irregular eating habits, overeating, or eating late at night.", "Exposure to strong sunlight and heat."],
    apathyaHi: ["भारी, तैलीय, तले हुए, मसालेदार और खट्टे खाद्य पदार्थ।", "प्रसंस्कृत खाद्य पदार्थों, जंक फूड और परिष्कृत चीनी का अत्यधिक सेवन।", "शराब और तंबाकू (पूरी तरह से बचें)।", "किण्वित खाद्य पदार्थ, अत्यधिक दही और पनीर।", "लाल मांस, भारी मछली, अंडे।", "असंगत खाद्य संयोजन।", "प्राकृतिक वेगों को रोकना।", "अनियमित खाने की आदतें, अधिक खाना, या देर रात खाना।", "तेज धूप और गर्मी के संपर्क में आना।"],
    apathyaGu: ["ભારે, તેલયુક્ત, તળેલા, મસાલેદાર અને ખાટા ખોરાક.", "પ્રોસેસેડ ફૂડ, જંક ફૂડ અને રિફાઇન્ડ ખાંડનું અતિશય સેવન.", "દારૂ અને તમાકુ (સંપૂર્ણપણે ટાળો).", "આથાવાળા ખોરાક, અતિશય દહીં અને ચીઝ.", "લાલ માંસ, ભારે માછલી, ઇંડા.", "અસંગત ખોરાક સંયોજનો.", "કુદરતી આવેગોને દબાવવા.", "અનિયમિત ખાવાની ટેવો, વધુ ખાવું, અથવા રાત્રે મોડેથી ખાવું.", "તીવ્ર સૂર્યપ્રકાશ અને ગરમીના સંપર્કમાં આવવું."],
  },
  {
    id: "pittashaya-ashmari",
    group: "Digestive Disorders",
    nameEn: "Pittashaya Ashmari (Gall Stones)",
    nameHi: "पित्ताशय अश्मरी (पित्त पथरी)",
    nameGu: "પિત્તાશય અશ્મરી (પિત્તની પથરી)",
    causesEn: ["Excessive intake of heavy, oily, fried, spicy, and incompatible foods.", "Irregular eating habits, skipping meals, or prolonged fasting.", "Suppression of natural urges (especially hunger and thirst).", "Sedentary lifestyle and lack of physical activity.", "Chronic digestive imbalances and weakened digestive fire (Agni).", "Excessive consumption of cold and heavy foods.", "Mental stress, anger, and other Pitta-aggravating emotions."],
    causesHi: ["भारी, तैलीय, तले हुए, मसालेदार और असंगत खाद्य पदार्थों का अत्यधिक सेवन।", "अनियमित खाने की आदतें, भोजन छोड़ना या लंबे समय तक उपवास।", "प्राकृतिक वेगों को रोकना (विशेषकर भूख और प्यास)।", "आलसी जीवन शैली और शारीरिक गतिविधि का अभाव।", "पुरानी पाचन असंतुलन और कमजोर पाचन अग्नि (अग्नि)।", "ठंडे और भारी खाद्य पदार्थों का अत्यधिक सेवन।", "मानसिक तनाव, क्रोध और अन्य पित्त-बढ़ाने वाले भाव।"],
    causesGu: ["ભારે, તેલયુક્ત, તળેલા, મસાલેદાર અને અસંગત ખોરાકનું અતિશય સેવન.", "અનિયમિત ખાવાની ટેવો, ભોજન છોડવું અથવા લાંબા સમય સુધી ઉપવાસ.", "કુદરતી આવેગોને દબાવવા (ખાસ કરીને ભૂખ અને તરસ).", "બેઠાડુ જીવનશૈલી અને શારીરિક પ્રવૃત્તિનો અભાવ.", "લાંબા સમયથી પાચન અસંતુલન અને નબળી પાચન અગ્નિ (અગ્નિ).", "ઠંડા અને ભારે ખોરાકનું અતિશય સેવન.", "માનસિક તણાવ, ક્રોધ અને અન્ય પિત્ત-વધાવનારા ભાવ."],
    pathyaEn: ["Grains: Old rice, barley, oats, wheat (in easily digestible forms).", "Pulses: Moong dal, masoor dal.", "Vegetables: Bitter gourd, bottle gourd, ridge gourd, pumpkin, carrots, beetroot, leafy greens (lightly cooked).", "Fruits: Pomegranate, apples, pears, grapes, papaya, amla (Indian gooseberry).", "Spices & Herbs: Turmeric, cumin, coriander, fennel, ginger (fresh, in moderation), mint, basil (tulsi).", "Drinks: Warm water, tender coconut water, buttermilk, herbal teas (e.g., dandelion, chicory).", "Practical Tips: Eat light, freshly prepared, and easily digestible meals. Maintain regular meal times. Avoid overeating. Drink plenty of warm water. Avoid prolonged fasting. Manage stress through relaxation techniques. Engage in regular light physical activity. Include bitter and astringent tastes in the diet. Seek medical advice for proper diagnosis and management."],
    pathyaHi: ["अनाज: पुराने चावल, जौ, ओट्स, गेहूं (आसानी से पचने वाले रूप में)।", "दालें: मूंग दाल, मसूर दाल।", "सब्जियां: करेला, लौकी, तोरई, कद्दू, गाजर, चुकंदर, हरी पत्तेदार सब्जियां (हल्की पकी हुई)।", "फल: अनार, सेब, नाशपाती, अंगूर, पपीता, आंवला।", "मसाले और जड़ी-बूटियाँ: हल्दी, जीरा, धनिया, सौंफ, अदरक (ताजा, मध्यम मात्रा में), पुदीना, तुलसी।", "पेय: गर्म पानी, नारियल का पानी, छाछ, हर्बल चाय (जैसे डेंडिलियन, चिकोरी)।", "व्यावहारिक सुझाव: हल्का, ताजा बना और आसानी से पचने वाला भोजन करें। नियमित भोजन का समय बनाए रखें। अधिक खाने से बचें। खूब गर्म पानी पिएं। लंबे समय तक उपवास से बचें। विश्राम तकनीकों के माध्यम से तनाव का प्रबंधन करें। नियमित हल्के शारीरिक गतिविधि करें। आहार में कड़वे और कसैले स्वाद शामिल करें। उचित निदान और प्रबंधन के लिए चिकित्सा सलाह लें।"],
    pathyaGu: ["અનાજ: જૂના ચોખા, જવ, ઓટ્સ, ઘઉં (સરળતાથી પચી શકે તેવા સ્વરૂપમાં).", "દાળો: મગની દાળ, મસૂર દાળ.", "શાકભાજી: કારેલા, દૂધી, તુરિયા, કોળું, ગાજર, બીટરૂટ, લીલા પાંદડાવાળી શાકભાજી (હળવી રાંધેલી).", "ફળો: દાડમ, સફરજન, નાશપતી, દ્રાક્ષ, પપૈયું, આમળા.", "મસાલા અને ઔષધિઓ: હળદર, જીરું, ધાણા, વરિયાળી, આદુ (તાજુ, મધ્યમ માત્રામાં), ફુદીનો, તુલસી.", "પીણાં: ગરમ પાણી, કુમળું નાળિયેર પાણી, છાશ, હર્બલ ટી (જેમ કે ડેંડિલિયન, ચીકોરી).", "વ્યવહારુ ટિપ્સ: હળવો, તાજા તૈયાર કરેલા અને સરળતાથી પચી શકે તેવા ભોજન લો. નિયમિત ભોજનનો સમય જાળવો. વધુ ખાવાનું ટાળો. પુષ્કળ ગરમ પાણી પીવો. લાંબા સમય સુધી ઉપવાસ ટાળો. રિલેક્સેશન ટેકનિક દ્વારા તણાવનું સંચાલન કરો. નિયમિત હળવી શારીરિક પ્રવૃત્તિ કરો. આહારમાં કડવા અને તુરા સ્વાદનો સમાવેશ કરો. યોગ્ય નિદાન અને સંચાલન માટે તબીબી સલાહ લો."],
    apathyaEn: ["Heavy, oily, fried, spicy, and sour foods.", "Excessive intake of processed foods, junk food, and refined sugar.", "Alcohol and tobacco (strictly avoid).", "Fermented foods, excessive curd, and cheese.", "Red meat, heavy fish, eggs.", "Incompatible food combinations.", "Prolonged fasting or irregular meal times.", "Sedentary lifestyle.", "Mental stress and anger."],
    apathyaHi: ["भारी, तैलीय, तले हुए, मसालेदार और खट्टे खाद्य पदार्थ।", "प्रसंस्कृत खाद्य पदार्थों, जंक फूड और परिष्कृत चीनी का अत्यधिक सेवन।", "शराब और तंबाकू (पूरी तरह से बचें)।", "किण्वित खाद्य पदार्थ, अत्यधिक दही और पनीर।", "लाल मांस, भारी मछली, अंडे।", "असंगत खाद्य संयोजन।", "लंबे समय तक उपवास या अनियमित भोजन का समय।", "आलसी जीवन शैली।", "मानसिक तनाव और क्रोध।"],
    apathyaGu: ["ભારે, તેલયુક્ત, તળેલા, મસાલેદાર અને ખાટા ખોરાક.", "પ્રોસેસેડ ફૂડ, જંક ફૂડ અને રિફાઇન્ડ ખાંડનું અતિશય સેવન.", "દારૂ અને તમાકુ (સંપૂર્ણપણે ટાળો).", "આથાવાળા ખોરાક, અતિશય દહીં અને ચીઝ.", "લાલ માંસ, ભારે માછલી, ઇંડા.", "અસંગત ખોરાક સંયોજનો.", "લાંબા સમય સુધી ઉપવાસ અથવા અનિયમિત ભોજનનો સમય.", "બેઠાડુ જીવનશૈલી.", "માનસિક તણાવ અને ક્રોધ."],
  },
  // ─── Urinary System Disorders ───────────────────────────────────────────────
  {
    id: "mutrakriccha",
    group: "Urinary System Disorders",
    nameEn: "Mutrakriccha (Burning Urination / Dysuria)",
    nameHi: "મૂत्रकृच्छ (Mutrakriccha) – जलन के साथ पेशाब",
    nameGu: "મૂત્રકૃચ્છ (Mutrakriccha) – બળતરા સાથે પેશાબ",
    causesEn: [
      "Excessive intake of spicy, pungent, and sour foods.",
      "Dry and astringent foods.",
      "Insufficient water intake.",
      "Alcohol and excessive caffeine.",
      "Suppression of natural urges (especially urination).",
      "Excessive exposure to heat or sun.",
      "Prolonged sitting in uncomfortable positions.",
      "Mental stress and anxiety.",
    ],
    causesHi: [
      "अत्यधिक मसालेदार, तीखे और खट्टे खाद्य पदार्थों का सेवन।",
      "सूखे और कसैले खाद्य पदार्थ।",
      "अपर्याप्त पानी का सेवन।",
      "शराब और अत्यधिक कैफीन।",
      "प्राकृतिक वेगों को रोकना (विशेषकर पेशाब)।",
      "अत्यधिक गर्मी या धूप के संपर्क में आना।",
      "असुविधाजनक स्थिति में लंबे समय तक बैठना।",
      "मानसिक तनाव और चिंता।",
    ],
    causesGu: [
      "અતિશય મસાલેદાર, તીખા અને ખાટા ખોરાકનું સેવન.",
      "સૂકા અને તુરા ખોરાક.",
      "અપૂરતું પાણી પીવું.",
      "આલ્કોહોલ અને અતિશય કેફીન.",
      "કુદરતી આવેગોને રોકવા (ખાસ કરીને પેશાબ).",
      "અતિશય ગરમી અથવા સૂર્યના સંપર્કમાં આવવું.",
      "અસ્વસ્થ સ્થિતિમાં લાંબા સમય સુધી બેસવું.",
      "માનસિક તણાવ અને ચિંતા.",
    ],
    pathyaEn: [
      "Plenty of water and fluids (coconut water, buttermilk).",
      "Cooling and sweet foods (barley water, rice gruel).",
      "Fresh fruits (melon, grapes) and vegetables (cucumber, pumpkin).",
      "Demulcent herbs: gokshura, punarnava, coriander.",
      "Milk and ghee (in moderation).",
      "Adequate rest; avoid physical exertion.",
      "Cool baths and local application of cool compresses.",
      "Stress management through meditation.",
    ],
    pathyaHi: [
      "खूब पानी और तरल पदार्थ (नारियल पानी, छाछ)।",
      "ठंडे और मीठे खाद्य पदार्थ (जौ का पानी, चावल का दलिया)।",
      "ताजे फल (खरबूजा, अंगूर) और सब्जियां (खीरा, कद्दू)।",
      "मूत्रवर्धक जड़ी-बूटियाँ: गोक्षुरा, पुनर्नवा, धनिया।",
      "दूध और घी (संयम में)।",
      "पर्याप्त आराम और शारीरिक परिश्रम से बचना।",
      "ठंडे स्नान और ठंडी पट्टी का स्थानीय प्रयोग।",
      "ध्यान के माध्यम से तनाव प्रबंधन।",
    ],
    pathyaGu: [
      "પુષ્કળ પાણી અને પ્રવાહી (નારિયેળ પાણી, છાશ).",
      "ઠંડા અને મીઠા ખોરાક (જવનું પાણી, ચોખાની કાંજી).",
      "તાજા ફળો (તરબૂચ, દ્રાક્ષ) અને શાકભાજી (કાકડી, કોળું).",
      "મૂત્રવર્ધક ઔષધિઓ: ગોક્ષુર, પુનર્નવા, ધાણા.",
      "દૂધ અને ઘી (મર્યાદિત માત્રામાં).",
      "પૂરતો આરામ અને શારીરિક શ્રમ ટાળવો.",
      "ઠંડા સ્નાન અને ઠંડા કોમ્પ્રેસનો સ્થાનિક ઉપયોગ.",
      "ધ્યાન દ્વારા તણાવ વ્યવસ્થાપન.",
    ],
    apathyaEn: [
      "Spicy, pungent, and sour foods.",
      "Excessive salt.",
      "Dry and processed foods.",
      "Alcohol, coffee, and carbonated drinks.",
      "Heavy and indigestible meals.",
      "Suppression of natural urges.",
      "Excessive exposure to heat or sun.",
      "Tight clothing around the groin area.",
    ],
    apathyaHi: [
      "मसालेदार, तीखे और खट्टे खाद्य पदार्थ।",
      "अत्यधिक नमक।",
      "सूखे और प्रसंस्कृत खाद्य पदार्थ।",
      "शराब, कॉफी और कार्बोनेटेड पेय।",
      "भारी और अपचनीय भोजन।",
      "प्राकृतिक वेगों को रोकना।",
      "अत्यधिक गर्मी या धूप के संपर्क में आना।",
      "कमर के आसपास तंग कपड़े।",
    ],
    apathyaGu: [
      "મસાલેદાર, તીખા અને ખાટા ખોરાક.",
      "અતિશય મીઠું.",
      "સૂકા અને પ્રોસેસ્ડ ખોરાક.",
      "આલ્કોહોલ, કોફી અને કાર્બોનેટેડ પીણાં.",
      "ભારે અને અપચનીય ભોજન.",
      "કુદરતી આવેગોને રોકવા.",
      "અતિશય ગરમી અથવા સૂર્યના સંપર્કમાં આવવું.",
      "કમરના વિસ્તારની આસપાસના ચુસ્ત કપડાં.",
    ],
  },
  {
    id: "uti",
    group: "Urinary System Disorders",
    nameEn: "UTI (Urinary Tract Infection)",
    nameHi: "मूत्रमार्ग संक्रमण (UTI)",
    nameGu: "મૂત્રમાર્ગ ચેપ (UTI)",
    causesEn: [
      "Excessive intake of spicy, salty, and pungent foods.",
      "Dry, acidic, and fermented foods.",
      "Insufficient fluid intake.",
      "Contaminated food and water.",
      "Poor hygiene practices.",
      "Suppression of natural urges (especially urination).",
      "Wearing tight and synthetic undergarments.",
      "Prolonged exposure to heat.",
      "Unprotected sexual activity.",
    ],
    causesHi: [
      "अत्यधिक मसालेदार, नमकीन और तीखे खाद्य पदार्थों का सेवन।",
      "सूखे, अम्लीय और किण्वित खाद्य पदार्थ।",
      "अपर्याप्त तरल पदार्थ का सेवन।",
      "दूषित भोजन और पानी।",
      "खराब स्वच्छता प्रथाएं।",
      "प्राकृतिक वेगों को रोकना (विशेषकर पेशाब)।",
      "तंग और सिंथेटिक अंतर्वस्त्र पहनना।",
      "गर्मी के लंबे समय तक संपर्क में रहना।",
      "असुरक्षित यौन संबंध।",
    ],
    causesGu: [
      "અતિશય મસાલેદાર, ખારા અને તીખા ખોરાકનું સેવન.",
      "સૂકા, એસિડિક અને આથોવાળા ખોરાક.",
      "અપૂરતું પ્રવાહી પીવું.",
      "દૂષિત ખોરાક અને પાણી.",
      "ખરાબ સ્વચ્છતા પ્રથાઓ.",
      "કુદરતી આવેગોને રોકવા (ખાસ કરીને પેશાબ).",
      "ચુસ્ત અને સિન્થેટિક અન્ડરવેર પહેરવા.",
      "ગરમીના લાંબા સમય સુધી સંપર્કમાં રહેવું.",
      "અસુરક્ષિત જાતીય પ્રવૃત્તિ.",
    ],
    pathyaEn: [
      "Plenty of water and fluids (cranberry juice, coconut water, barley water).",
      "Cooling and demulcent foods (cucumber, pumpkin, melons).",
      "Sweet and bitter tastes.",
      "Herbal remedies: gokshura, punarnava, coriander seeds.",
      "Light and easily digestible meals.",
      "Fresh fruits and vegetables.",
      "Maintain good personal hygiene.",
      "Urinate regularly and completely; wear loose-fitting cotton undergarments.",
    ],
    pathyaHi: [
      "खूब पानी और तरल पदार्थ (क्रैनबेरी जूस, नारियल पानी, जौ का पानी)।",
      "ठंडे और मूत्रवर्धक खाद्य पदार्थ (खीरा, कद्दू, तरबूज)।",
      "मीठे और कड़वे स्वाद।",
      "हर्बल उपचार: गोक्षुरा, पुनर्नवा, धनिया के बीज।",
      "हल्के और सुपाच्य भोजन।",
      "ताजे फल और सब्जियां।",
      "अच्छी व्यक्तिगत स्वच्छता बनाए रखें।",
      "नियमित रूप से पेशाब करें; ढीले-ढाले सूती अंतर्वस्त्र पहनें।",
    ],
    pathyaGu: [
      "પુષ્કળ પાણી અને પ્રવાહી (ક્રેનબેરી જ્યુસ, નારિયેળ પાણી, જવનું પાણી).",
      "ઠંડા અને શામક ખોરાક (કાકડી, કોળું, તરબૂચ).",
      "મીઠા અને કડવા સ્વાદ.",
      "હર્બલ ઉપચાર: ગોક્ષુર, પુનર્નવા, ધાણાના બીજ.",
      "હળવા અને સરળતાથી પચી જાય તેવા ભોજન.",
      "તાજા ફળો અને શાકભાજી.",
      "સારી અંગત સ્વચ્છતા જાળવો.",
      "નિયમિત પેશાબ કરો; ઢીલા-ઢાળા સુતરાઉ અન્ડરવેર પહેરો.",
    ],
    apathyaEn: [
      "Spicy, pungent, and acidic foods.",
      "Excessive salt and sour foods.",
      "Alcohol, coffee, and carbonated beverages.",
      "Processed and artificial foods.",
      "Heavy and indigestible meals.",
      "Suppression of urination and other natural urges.",
      "Poor hygiene.",
      "Tight or synthetic clothing.",
    ],
    apathyaHi: [
      "मसालेदार, तीखे और अम्लीय खाद्य पदार्थ।",
      "अत्यधिक नमक और खट्टे खाद्य पदार्थ।",
      "शराब, कॉफी और कार्बोनेटेड पेय।",
      "प्रसंस्कृत और कृत्रिम खाद्य पदार्थ।",
      "भारी और अपचनीय भोजन।",
      "पेशाब और अन्य प्राकृतिक वेगों को रोकना।",
      "खराब स्वच्छता।",
      "तंग या सिंथेटिक कपड़े पहनना।",
    ],
    apathyaGu: [
      "મસાલેદાર, તીખા અને એસિડિક ખોરાક.",
      "અતિશય મીઠું અને ખાટા ખોરાક.",
      "આલ્કોહોલ, કોફી અને કાર્બોનેટેડ પીણાં.",
      "પ્રોસેસ્ડ અને કૃત્રિમ ખોરાક.",
      "ભારે અને અપચનીય ભોજન.",
      "પેશાબ અને અન્ય કુદરતી આવેગોને રોકવા.",
      "ખરાબ સ્વચ્છતા.",
      "ચુસ્ત અથવા સિન્થેટિક કપડાં પહેરવા.",
    ],
  },
  {
    id: "ashmari",
    group: "Urinary System Disorders",
    nameEn: "Ashmari (Kidney Stones / Renal Calculi)",
    nameHi: "अश्मरी (गुर्दे की पथरी)",
    nameGu: "અશ્મરી (કિડની સ્ટોન / પથરી)",
    causesEn: [
      "Insufficient water intake and dehydration.",
      "Excessive intake of dry, heavy, and oily foods.",
      "Foods high in oxalates (spinach, chocolate, nuts).",
      "Excessive consumption of meat and dairy products.",
      "Suppression of thirst and hunger.",
      "Sedentary lifestyle and lack of physical activity.",
      "Suppression of natural urges (especially urination).",
      "Stress and anxiety.",
    ],
    causesHi: [
      "अपर्याप्त पानी का सेवन और निर्जलीकरण।",
      "अत्यधिक सूखे, भारी और तैलीय खाद्य पदार्थों का सेवन।",
      "ऑक्सालेट में उच्च खाद्य पदार्थ (पालक, चॉकलेट, मेवे)।",
      "मांस और डेयरी उत्पादों का अत्यधिक सेवन।",
      "प्यास और भूख को दबाना।",
      "बैठा हुआ जीवन शैली और शारीरिक गतिविधि का अभाव।",
      "प्राकृतिक वेगों को रोकना (विशेषकर पेशाब)।",
      "तनाव और चिंता।",
    ],
    causesGu: [
      "અપૂરતું પાણી પીવું અને ડિહાઇડ્રેશન.",
      "અતિશય સૂકા, ભારે અને તૈલી ખોરાકનું સેવન.",
      "ઓક્સાલેટમાં ઉચ્ચ ખોરાક (પાલક, ચોકલેટ, નટ્સ).",
      "માંસ અને ડેરી ઉત્પાદનોનો અતિશય વપરાશ.",
      "તરસ અને ભૂખને દબાવવી.",
      "બેઠાડુ જીવનશૈલી અને શારીરિક પ્રવૃત્તિનો અભાવ.",
      "કુદરતી આવેગોને રોકવા (ખાસ કરીને પેશાબ).",
      "તણાવ અને ચિંતા.",
    ],
    pathyaEn: [
      "Plenty of water and fluids (coconut water, barley water, buttermilk).",
      "Foods that help dissolve stones: horse gram (kulathi), radish, lemon juice.",
      "Alkaline foods: cucumber, pumpkin, leafy greens.",
      "Herbs: gokshura, punarnava, varuna, pashanbhed.",
      "Light and easily digestible meals.",
      "Regular moderate exercise and walking.",
      "Adequate rest and sleep.",
      "Stress management; Panchakarma under expert guidance.",
    ],
    pathyaHi: [
      "खूब पानी और तरल पदार्थ (नारियल पानी, जौ का पानी, छाछ)।",
      "पथरी को घोलने वाले खाद्य पदार्थ: कुलथी, मूली, नींबू का रस।",
      "क्षारीय खाद्य पदार्थ: खीरा, कद्दू, पत्तेदार साग।",
      "जड़ी-बूटियाँ: गोक्षुरा, पुनर्नवा, वरुण, पाषाणभेद।",
      "हल्के और सुपाच्य भोजन।",
      "नियमित मध्यम व्यायाम, चलना।",
      "पर्याप्त आराम और नींद।",
      "तनाव प्रबंधन; विशेषज्ञ मार्गदर्शन में पंचकर्म चिकित्सा।",
    ],
    pathyaGu: [
      "પુષ્કળ પાણી અને પ્રવાહી (નારિયેળ પાણી, જવનું પાણી, છાશ).",
      "પથરી ઓગળવામાં મદદ કરતા ખોરાક: કળથી, મૂળો, લીંબુનો રસ.",
      "આલ્કલાઇન ખોરાક: કાકડી, કોળું, પાંદડાવાળા શાકભાજી.",
      "ઔષધિઓ: ગોક્ષુર, પુનર્નવા, વરુણ, પાષાણભેદ.",
      "હળવા અને સરળતાથી પચી જાય તેવા ભોજન.",
      "નિયમિત મધ્યમ કસરત, ચાલવું.",
      "પૂરતો આરામ અને ઊંઘ.",
      "તણાવ વ્યવસ્થાપન; નિષ્ણાત માર્ગદર્શન હેઠળ પંચકર્મ ઉપચાર.",
    ],
    apathyaEn: [
      "Foods high in oxalates (spinach, rhubarb, chocolate, nuts).",
      "Excessive meat, poultry, and fish.",
      "Salty and sour foods, pickles.",
      "Dairy products (cheese, paneer) in excess.",
      "Soft drinks, alcohol, and excessive caffeine.",
      "Sedentary lifestyle and lack of physical activity.",
      "Suppression of natural urges.",
      "Prolonged exposure to heat and dehydration.",
    ],
    apathyaHi: [
      "ऑक्सालेट में उच्च खाद्य पदार्थ (पालक, रूबर्ब, चॉकलेट, मेवे)।",
      "अत्यधिक मांस, मुर्गी और मछली।",
      "नमकीन और खट्टे खाद्य पदार्थ, अचार।",
      "डेयरी उत्पाद (पनीर) अधिक मात्रा में।",
      "सॉफ्ट ड्रिंक्स, शराब और अत्यधिक कैफीन।",
      "बैठा हुआ जीवन शैली और शारीरिक गतिविधि का अभाव।",
      "प्राकृतिक वेगों को रोकना।",
      "गर्मी और निर्जलीकरण के लंबे समय तक संपर्क।",
    ],
    apathyaGu: [
      "ઓક્સાલેટમાં ઉચ્ચ ખોરાક (પાલક, રેવંચી, ચોકલેટ, નટ્સ).",
      "અતિશય માંસ, મરઘાં અને માછલી.",
      "ખારા અને ખાટા ખોરાક, અથાણાં.",
      "ડેરી ઉત્પાદનો (ચીઝ, પનીર) વધુ પડતા.",
      "સોફ્ટ ડ્રિંક્સ, આલ્કોહોલ અને અતિશય કેફીન.",
      "બેઠાડુ જીવનશૈલી અને શારીરિક પ્રવૃત્તિનો અભાવ.",
      "કુદરતી આવેગોને રોકવા.",
      "ગરમી અને ડિહાઇડ્રેશનના લાંબા સમય સુધી સંપર્ક.",
    ],
  },
  {
    id: "prostate-vruddhi",
    group: "Urinary System Disorders",
    nameEn: "Prostate Enlargement (BPH – Benign Prostatic Hyperplasia)",
    nameHi: "प्रोस्टेट वृद्धि (BPH – सौम्य प्रोस्टेटिक हाइपरप्लासिया)",
    nameGu: "પ્રોસ્ટેટ વૃદ્ધિ (BPH – બેનાઇન પ્રોસ્ટેટિક હાઇપરપ્લાસિયા)",
    causesEn: [
      "Excessive intake of dry, cold, and astringent foods.",
      "Heavy and indigestible meals.",
      "Insufficient water intake.",
      "Excessive consumption of spicy foods (aggravating Pitta and Vata).",
      "Suppression of natural urges (especially urination).",
      "Prolonged sitting and sedentary lifestyle.",
      "Exposure to cold and damp environments.",
      "Stress and anxiety.",
    ],
    causesHi: [
      "अत्यधिक सूखे, ठंडे और कसैले खाद्य पदार्थों का सेवन।",
      "भारी और अपचनीय भोजन।",
      "अपर्याप्त पानी का सेवन।",
      "मसालेदार खाद्य पदार्थों का अत्यधिक सेवन (पित्त और वात को बढ़ाने वाला)।",
      "प्राकृतिक वेगों को रोकना (विशेषकर पेशाब)।",
      "लंबे समय तक बैठना, बैठी जीवन शैली।",
      "ठंडे और नम वातावरण के संपर्क में आना।",
      "तनाव और चिंता।",
    ],
    causesGu: [
      "અતિશય સૂકા, ઠંડા અને તુરા ખોરાકનું સેવન.",
      "ભારે અને અપચનીય ભોજન.",
      "અપૂરતું પાણી પીવું.",
      "મસાલેદાર ખોરાકનો અતિશય વપરાશ (પિત્ત અને વાતને વધારનાર).",
      "કુદરતી આવેગોને રોકવા (ખાસ કરીને પેશાબ).",
      "લાંબા સમય સુધી બેસવું, બેઠાડુ જીવનશૈલી.",
      "ઠંડા અને ભેજવાળા વાતાવરણના સંપર્કમાં આવવું.",
      "તણાવ અને ચિંતા.",
    ],
    pathyaEn: [
      "Plenty of warm water and fluids.",
      "Light and easily digestible foods.",
      "Vegetables: pumpkin, bottle gourd, spinach.",
      "Fruits: watermelon, cranberries.",
      "Herbs: gokshura, punarnava, varuna, shilajit.",
      "Slightly nourishing foods with good quality ghee.",
      "Regular physical activity, moderate exercise, yoga.",
      "Warm sitz baths; adequate sleep and rest.",
    ],
    pathyaHi: [
      "खूब गर्म पानी और तरल पदार्थ।",
      "हल्के और सुपाच्य भोजन।",
      "सब्जियां: कद्दू, लौकी, पालक।",
      "फल: तरबूज, क्रैनबेरी।",
      "जड़ी-बूटियाँ: गोक्षुरा, पुनर्नवा, वरुण, शिलाजीत।",
      "अच्छी गुणवत्ता वाले घी के साथ थोड़ा पौष्टिक भोजन।",
      "नियमित शारीरिक गतिविधि, मध्यम व्यायाम, योग।",
      "गर्म कटि स्नान; पर्याप्त नींद और आराम।",
    ],
    pathyaGu: [
      "પુષ્કળ ગરમ પાણી અને પ્રવાહી.",
      "હળવા અને સરળતાથી પચી જાય તેવા ભોજન.",
      "શાકભાજી: કોળું, દૂધી, પાલક.",
      "ફળો: તરબૂચ, ક્રેનબેરી.",
      "ઔષધિઓ: ગોક્ષુર, પુનર્નવા, વરુણ, શિલાજીત.",
      "સારી ગુણવત્તાવાળા ઘી સાથે થોડો પૌષ્ટિક ખોરાક.",
      "નિયમિત શારીરિક પ્રવૃત્તિ, મધ્યમ કસરત, યોગ.",
      "ગરમ કટિ સ્નાન; પૂરતી ઊંઘ અને આરામ.",
    ],
    apathyaEn: [
      "Excessive dry, cold, and astringent foods.",
      "Heavy and indigestible meals.",
      "Excessive spicy and pungent foods.",
      "Alcohol, caffeine, and carbonated drinks.",
      "Deep-fried and processed foods.",
      "Suppression of natural urges.",
      "Prolonged sitting and sedentary lifestyle.",
      "Excessive stress and irregular routines.",
    ],
    apathyaHi: [
      "अत्यधिक सूखे, ठंडे और कसैले खाद्य पदार्थ।",
      "भारी और अपचनीय भोजन।",
      "अत्यधिक मसालेदार और तीखे खाद्य पदार्थ।",
      "शराब, कैफीन और कार्बोनेटेड पेय।",
      "डीप-फ्राइड और प्रसंस्कृत खाद्य पदार्थ।",
      "प्राकृतिक वेगों को रोकना।",
      "लंबे समय तक बैठना और बैठी जीवन शैली।",
      "अत्यधिक तनाव और अनियमित दिनचर्या।",
    ],
    apathyaGu: [
      "અતિશય સૂકા, ઠંડા અને તુરા ખોરાક.",
      "ભારે અને અપચનીય ભોજન.",
      "અતિશય મસાલેદાર અને તીખા ખોરાક.",
      "આલ્કોહોલ, કેફીન અને કાર્બોનેટેડ પીણાં.",
      "ડીપ-ફ્રાઈડ અને પ્રોસેસ્ડ ખોરાક.",
      "કુદરતી આવેગોને રોકવા.",
      "લાંબા સમય સુધી બેસવું અને બેઠાડુ જીવનશૈલી.",
      "અતિશય તણાવ અને અનિયમિત દિનચર્યા.",
    ],
  },
  {
    id: "atimutra",
    group: "Urinary System Disorders",
    nameEn: "Frequent Urination (Atimutra / Polyuria)",
    nameHi: "बार-बार पेशाब आना (अतिमूत्र / पॉलीयूरिया)",
    nameGu: "વારંવાર પેશાબ આવવો (અતિમૂત્ર / પોલીયુરિયા)",
    causesEn: [
      "Excessive intake of cold, dry, and light foods.",
      "Diuretic beverages: excessive tea, coffee, alcohol.",
      "Spicy and pungent foods (aggravating Pitta and Vata).",
      "Insufficient nourishing foods.",
      "Suppression of natural urges.",
      "Exposure to cold weather and environments.",
      "Mental stress, anxiety, and nervousness.",
      "Lack of adequate rest and sleep.",
    ],
    causesHi: [
      "अत्यधिक ठंडे, सूखे और हल्के खाद्य पदार्थों का सेवन।",
      "अत्यधिक चाय, कॉफी, शराब जैसे मूत्रवर्धक पेय।",
      "मसालेदार और तीखे खाद्य पदार्थ (पित्त और वात को बढ़ाने वाला)।",
      "अपर्याप्त पौष्टिक भोजन।",
      "प्राकृतिक वेगों को रोकना।",
      "ठंडे मौसम और वातावरण के संपर्क में आना।",
      "मानसिक तनाव, चिंता और घबराहट।",
      "पर्याप्त आराम और नींद का अभाव।",
    ],
    causesGu: [
      "અતિશય ઠંડા, સૂકા અને હળવા ખોરાકનું સેવન.",
      "અતિશય ચા, કોફી, આલ્કોહોલ જેવા મૂત્રવર્ધક પીણાં.",
      "મસાલેદાર અને તીખા ખોરાક (પિત્ત અને વાતને વધારનાર).",
      "અપૂરતું પૌષ્ટિક ભોજન.",
      "કુદરતી આવેગોને રોકવા.",
      "ઠંડા હવામાન અને વાતાવરણના સંપર્કમાં આવવું.",
      "માનસિક તણાવ, ચિંતા અને ગભરાટ.",
      "પૂરતો આરામ અને ઊંઘનો અભાવ.",
    ],
    pathyaEn: [
      "Warm and nourishing foods (soups, stews).",
      "Demulcent and sweet foods: rice gruel, milk, ghee.",
      "Herbs: shatavari, ashwagandha, gokshura, guduchi.",
      "Warm water and herbal teas that pacify Vata.",
      "Root vegetables and grounding grains.",
      "Regular routine and calming activities (meditation, yoga).",
      "Adequate rest and sleep in a warm environment.",
      "Gentle Abhyanga (oil massage) with warm oil.",
    ],
    pathyaHi: [
      "गर्म और पौष्टिक भोजन (सूप, स्टू)।",
      "मूत्रवर्धक और मीठे खाद्य पदार्थ: चावल का दलिया, दूध, घी।",
      "जड़ी-बूटियाँ: शतावरी, अश्वगंधा, गोक्षुरा, गुडूची।",
      "गर्म पानी और वात शांत करने वाली हर्बल चाय।",
      "जड़ वाली सब्जियां और अनाज।",
      "नियमित दिनचर्या और शांत करने वाली गतिविधियाँ (ध्यान, योग)।",
      "गर्म वातावरण में पर्याप्त आराम और नींद।",
      "गर्म तेल के साथ हल्का अभ्यंग (तेल मालिश)।",
    ],
    pathyaGu: [
      "ગરમ અને પૌષ્ટિક ભોજન (સૂપ, સ્ટ્યૂ).",
      "શામક અને મીઠા ખોરાક: ચોખાની કાંજી, દૂધ, ઘી.",
      "ઔષધિઓ: શતાવરી, અશ્વગંધા, ગોક્ષુર, ગુડુચી.",
      "ગરમ પાણી અને વાતને શાંત કરતી હર્બલ ચા.",
      "મૂળ શાકભાજી અને સ્થિર કરતા અનાજ.",
      "નિયમિત દિનચર્યા અને શાંત કરતી પ્રવૃત્તિઓ (ધ્યાન, યોગ).",
      "ગરમ વાતાવરણમાં પૂરતો આરામ અને ઊંઘ.",
      "ગરમ તેલ સાથે હળવો અભ્યંગ (તેલ માલિશ).",
    ],
    apathyaEn: [
      "Excessive intake of diuretic beverages (coffee, tea, alcohol).",
      "Cold, dry, and light foods.",
      "Spicy, pungent, and astringent foods.",
      "Raw salads and cold drinks.",
      "Excessive refined sugars and processed foods.",
      "Suppression of natural urges.",
      "Exposure to cold and wind.",
      "Irregular sleep patterns and late nights.",
    ],
    apathyaHi: [
      "मूत्रवर्धक पेय पदार्थों का अत्यधिक सेवन (कॉफी, चाय, शराब)।",
      "ठंडे, सूखे और हल्के खाद्य पदार्थ।",
      "मसालेदार, तीखे और कसैले खाद्य पदार्थ।",
      "कच्चे सलाद और ठंडे पेय।",
      "अत्यधिक परिष्कृत शर्करा और प्रसंस्कृत खाद्य पदार्थ।",
      "प्राकृतिक वेगों को रोकना।",
      "ठंड और हवा के संपर्क में आना।",
      "अनियमित नींद के पैटर्न और देर रात तक जागना।",
    ],
    apathyaGu: [
      "મૂત્રવર્ધક પીણાંનો અતિશય વપરાશ (કોફી, ચા, આલ્કોહોલ).",
      "ઠંડા, સૂકા અને હળવા ખોરાક.",
      "મસાલેદાર, તીખા અને તુરા ખોરાક.",
      "કાચા સલાડ અને ઠંડા પીણાં.",
      "અતિશય રિફાઇન્ડ શર્કરા અને પ્રોસેસ્ડ ખોરાક.",
      "કુદરતી આવેગોને રોકવા.",
      "ઠંડી અને પવનના સંપર્કમાં આવવું.",
      "અનિયમિત ઊંઘની પેટર્ન અને મોડી રાત સુધી જાગવું.",
    ],
  },
];

// ─── JSON Import helpers ────────────────────────────────────────────────────
const STORAGE_KEY = "mc_imported_diseases";
function loadImportedDiseases(): Disease[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveImportedDiseases(list: Disease[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function parseJsonDisease(raw: any): Disease | null {
  try {
    // Support both "english"/"hindi"/"gujarati" and "en"/"hi"/"gu" key formats
    const pick = (obj: any, ...langs: string[]): string[] => {
      if (!obj) return [];
      for (const lang of langs) {
        if (Array.isArray(obj[lang])) return obj[lang];
      }
      return [];
    };
    const dn = raw.disease_name || {};
    // Support both nidana (with ahara/vihara sub-keys) and flat causes/pathya/apathya
    const nid = raw.nidana || {};
    const ahara_nid = nid.ahara || {};
    const vihara_nid = nid.vihara || {};
    // Flat format uses "causes" directly with en/hi/gu arrays
    const causesFlat = raw.causes || {};
    const path = raw.pathya || {};
    const ahara_path = path.ahara || {};
    const vihara_path = path.vihara || {};
    // Flat format: pathya.en is directly an array
    const pathyaFlat = (Array.isArray(path.en) || Array.isArray(path.hi) || Array.isArray(path.gu)) ? path : {};
    const apat = raw.apathya || {};
    const ahara_apat = apat.ahara || {};
    const vihara_apat = apat.vihara || {};
    const apathyaFlat = (Array.isArray(apat.en) || Array.isArray(apat.hi) || Array.isArray(apat.gu)) ? apat : {};

    const combineLang = (nested_a: any, nested_b: any, flat: any, enKey: string, hiKey: string, guKey: string) => ({
      en: [...pick(nested_a, enKey), ...pick(nested_b, enKey), ...pick(flat, "en", enKey)],
      hi: [...pick(nested_a, hiKey), ...pick(nested_b, hiKey), ...pick(flat, "hi", hiKey)],
      gu: [...pick(nested_a, guKey), ...pick(nested_b, guKey), ...pick(flat, "gu", guKey)],
    });

    const causes  = combineLang(ahara_nid, vihara_nid, causesFlat, "english", "hindi", "gujarati");
    const pathya  = combineLang(ahara_path, vihara_path, pathyaFlat, "english", "hindi", "gujarati");
    const apathya = combineLang(ahara_apat, vihara_apat, apathyaFlat, "english", "hindi", "gujarati");

    // disease_name supports both en/hi/gu and english/hindi/gujarati
    const nameEn = dn.english || dn.en || "";
    const nameHi = dn.hindi   || dn.hi || nameEn;
    const nameGu = dn.gujarati || dn.gu || nameEn;

    const id = nameEn.toLowerCase().replace(/[\s()\/]+/g, "-") || raw.id || "";
    if (!id) return null;
    return {
      id,
      group: raw.group || "Imported",
      nameEn,
      nameHi,
      nameGu,
      causesEn: causes.en,
      causesHi: causes.hi,
      causesGu: causes.gu,
      pathyaEn: pathya.en,
      pathyaHi: pathya.hi,
      pathyaGu: pathya.gu,
      apathyaEn: apathya.en,
      apathyaHi: apathya.hi,
      apathyaGu: apathya.gu,
    };
  } catch { return null; }
}
const GROUP_LABEL = { hi: "रोग सूची", gu: "રોગ સૂચિ" };

function loadHiddenDiseaseIds(): string[] {
  try { return JSON.parse(localStorage.getItem("pa_hidden_diseases") || "[]"); }
  catch { return []; }
}
function saveHiddenDiseaseIds(ids: string[]) {
  localStorage.setItem("pa_hidden_diseases", JSON.stringify(ids));
}

function formatMobile(m: string): string {
  const d = m.replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.startsWith("91") && d.length === 12) return d;
  return d;
}

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
  const [patientMobile, setPatientMobile] = useState("");
  const [diseaseSearch, setDiseaseSearch] = useState("");
  const [selected, setSelected]       = useState<Disease>(diseases[0]);

  // ─── JSON Import panel ────────────────────────────────────────────────────
  const [importedDiseases, setImportedDiseases] = useState<Disease[]>(() => loadImportedDiseases());
  const [showImportPanel, setShowImportPanel]   = useState(false);
  const [importJson, setImportJson]             = useState("");
  const [importMsg, setImportMsg]               = useState<{ type: "ok"|"err"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Delete mode ──────────────────────────────────────────────────────────
  const [deleteMode, setDeleteMode]             = useState(false);
  const [hiddenIds, setHiddenIds]               = useState<string[]>(() => loadHiddenDiseaseIds());
  const [confirmDelete, setConfirmDelete]       = useState<Disease | null>(null);

  // ─── Share as Image ───────────────────────────────────────────────────────
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing]           = useState(false);
  const [showImageShareModal, setShowImageShareModal] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);

  const allDiseases = [...diseases, ...importedDiseases].filter(d => !hiddenIds.includes(d.id));

  const handleImport = (jsonText: string) => {
    setImportMsg(null);
    try {
      const parsed = JSON.parse(jsonText);
      const items: any[] = Array.isArray(parsed) ? parsed : [parsed];
      const added: Disease[] = [];
      const skipped: string[] = [];
      for (const item of items) {
        const d = parseJsonDisease(item);
        if (!d) { skipped.push(item?.disease_name?.english || "unknown"); continue; }
        if (allDiseases.find(x => x.id === d.id)) {
          skipped.push(d.nameEn + " (duplicate)"); continue;
        }
        added.push(d);
      }
      if (added.length === 0) {
        setImportMsg({ type: "err", text: `No new diseases added. Skipped: ${skipped.join(", ")}` });
        return;
      }
      const newList = [...importedDiseases, ...added];
      setImportedDiseases(newList);
      saveImportedDiseases(newList);
      setSelected(added[0]);
      setImportJson("");
      let msg = `✅ ${added.length} disease(s) imported successfully!`;
      if (skipped.length) msg += ` (Skipped: ${skipped.join(", ")})`;
      setImportMsg({ type: "ok", text: msg });
    } catch (e: any) {
      setImportMsg({ type: "err", text: "Invalid JSON: " + e.message });
    }
  };

  const extractJsonFromTxt = (text: string): string => {
    // 1. Try ```json ... ``` blocks first
    const blocks: any[] = [];
    const backtickRegex = /```json\s*([\s\S]*?)```/g;
    let match;
    while ((match = backtickRegex.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (Array.isArray(parsed)) blocks.push(...parsed);
        else blocks.push(parsed);
      } catch { /* skip invalid blocks */ }
    }
    if (blocks.length > 0) return JSON.stringify(blocks);

    // 2. Extract ALL top-level [ ... ] and { ... } JSON blocks via bracket matching
    const extracted: any[] = [];
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (ch === "[" || ch === "{") {
        const open = ch, close = ch === "[" ? "]" : "}";
        let depth = 0, j = i;
        while (j < text.length) {
          if (text[j] === open) depth++;
          else if (text[j] === close) { depth--; if (depth === 0) break; }
          j++;
        }
        if (depth === 0) {
          try {
            const parsed = JSON.parse(text.slice(i, j + 1));
            if (Array.isArray(parsed)) extracted.push(...parsed);
            else extracted.push(parsed);
            i = j + 1;
            continue;
          } catch { /* not valid JSON at this bracket, keep scanning */ }
        }
      }
      i++;
    }
    if (extracted.length > 0) return JSON.stringify(extracted);
    return text;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result as string;
      const isTxt = file.name.toLowerCase().endsWith(".txt") || file.type === "text/plain";
      const jsonText = isTxt ? extractJsonFromTxt(raw) : raw;
      setImportJson(jsonText);
      handleImport(jsonText);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const removeImported = (id: string) => {
    const newList = importedDiseases.filter(d => d.id !== id);
    setImportedDiseases(newList);
    saveImportedDiseases(newList);
    if (selected.id === id) setSelected(diseases[0]);
  };

  const deleteDisease = (disease: Disease) => {
    const isImported = importedDiseases.find(x => x.id === disease.id);
    if (isImported) {
      removeImported(disease.id);
    } else {
      const newHidden = [...hiddenIds, disease.id];
      setHiddenIds(newHidden);
      saveHiddenDiseaseIds(newHidden);
    }
    if (selected.id === disease.id) {
      const remaining = [...diseases, ...importedDiseases].filter(
        d => d.id !== disease.id && ![...hiddenIds, disease.id].includes(d.id)
      );
      if (remaining.length > 0) setSelected(remaining[0]);
    }
    setConfirmDelete(null);
  };

  const restoreAllDiseases = () => {
    setHiddenIds([]);
    saveHiddenDiseaseIds([]);
  };

  // Patient search states
  const [ptQuery, setPtQuery]           = useState("");
  const [ptResults, setPtResults]       = useState<PatientRecord[]>([]);
  const [showPtDrop, setShowPtDrop]     = useState(false);
  const [loadedPatient, setLoadedPatient] = useState<PatientRecord | null>(null);
  const ptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ptRef.current && !ptRef.current.contains(e.target as Node)) setShowPtDrop(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handlePtSearch = (q: string) => {
    setPtQuery(q);
    if (q.length >= 2) {
      const r = searchPatients(q);
      setPtResults(r);
      setShowPtDrop(r.length > 0);
    } else {
      setPtResults([]); setShowPtDrop(false);
    }
  };

  const handleSelectPatient = (p: PatientRecord) => {
    setPatientName(p.name);
    setPatientMobile(p.mobile);
    setLoadedPatient(p);
    setPtQuery(p.name);
    setShowPtDrop(false);
  };

  const clearPatient = () => {
    setPtQuery(""); setPatientName(""); setPatientMobile("");
    setLoadedPatient(null); setPtResults([]); setShowPtDrop(false);
  };

  const getName    = () => lang === "gu" ? selected.nameGu    : selected.nameHi;
  const getCauses  = () => lang === "gu" ? selected.causesGu  : selected.causesHi;
  const getPathya  = () => lang === "gu" ? selected.pathyaGu  : selected.pathyaHi;
  const getApathya = () => lang === "gu" ? selected.apathyaGu : selected.apathyaHi;

  const today = format(new Date(), "dd/MM/yyyy");
  const pathyaTitle  = lang === "gu" ? "પથ્ય — શું ખાવું"      : "पथ्य — क्या खाएं";
  const apathyaTitle = lang === "gu" ? "અપથ્ય — શું ન ખાવું"   : "अपथ्य — क्या न खाएं";
  const causesTitle  = lang === "gu" ? "કારણ (Nidana)"         : "कारण (Nidana)";

  const shareOnWhatsApp = () => {
    const name    = getName();
    const causes  = getCauses().map(c => `  • ${c}`).join("\n");
    const pathya  = getPathya().map(p => `  • ${p}`).join("\n");
    const apathya = getApathya().map(a => `  • ${a}`).join("\n");
    const ptLine  = patientName ? `\n*${lang === "gu" ? "દર્દી" : "दर्दी"}:* ${patientName}` : "";
    const footer  = lang === "gu"
      ? "_Manglam Clinic તરફથી આયુર્વેદિક માર્ગદર્શન_"
      : "_Manglam Clinic से आयुर्वेदिक मार्गदर्शन_";

    const msg = [
      `*Manglam Clinic*`,
      `Dr. Vijay Girglani | B.A.M.S. | Reg. GBI 17318`,
      ptLine,
      `*${lang === "gu" ? "તારીખ" : "तारीख"}:* ${today}`,
      ``,
      `*${name}* (${selected.nameEn})`,
      ``,
      `*${causesTitle}:*`,
      causes,
      ``,
      `*${pathyaTitle}*`,
      pathya,
      ``,
      `*${apathyaTitle}*`,
      apathya,
      ``,
      footer,
    ].filter(l => l !== "").join("\n");

    const number = patientMobile ? formatMobile(patientMobile) : "";
    const url = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const shareAsImage = async () => {
    setIsCapturing(true);
    try {
      const W = 900, SCALE = 2;
      const causes  = getCauses();
      const pathya  = getPathya();
      const apathya = getApathya();
      const name     = getName();

      // ── helpers ──────────────────────────────────────────────────────────
      const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] => {
        const words = text.split(" ");
        const lines: string[] = [];
        let cur = "";
        for (const w of words) {
          const test = cur ? cur + " " + w : w;
          if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
          else cur = test;
        }
        if (cur) lines.push(cur);
        return lines;
      };

      const drawBulletBlock = (
        ctx: CanvasRenderingContext2D,
        items: string[], y: number,
        xLeft: number, maxW: number,
        bulletColor: string, textColor: string,
        fontSize: number
      ): number => {
        ctx.font = `${fontSize * SCALE}px Arial, sans-serif`;
        ctx.fillStyle = textColor;
        const lh = (fontSize + 5) * SCALE;
        for (const item of items) {
          const lines = wrapText(ctx, item, maxW);
          // bullet
          ctx.fillStyle = bulletColor;
          ctx.fillText("•", xLeft, y + lh * 0.8);
          ctx.fillStyle = textColor;
          for (let li = 0; li < lines.length; li++) {
            ctx.fillText(lines[li], xLeft + 18 * SCALE, y + lh * (li + 0.85));
          }
          y += lh * lines.length + 4 * SCALE;
        }
        return y;
      };

      // ── first pass: measure height ────────────────────────────────────────
      const measure = document.createElement("canvas");
      measure.width = W * SCALE;
      measure.height = 100;
      const mctx = measure.getContext("2d")!;

      const measureBlock = (items: string[], maxW: number, fontSize: number): number => {
        mctx.font = `${fontSize * SCALE}px Arial, sans-serif`;
        const lh = (fontSize + 5) * SCALE;
        let h = 0;
        for (const item of items) {
          const lines = wrapText(mctx, item, maxW);
          h += lh * lines.length + 4 * SCALE;
        }
        return h;
      };

      const PAD = 24 * SCALE;
      const colW = (W / 2 - 36) * SCALE;
      const fullW = (W - 48) * SCALE;

      const headerH  = 110 * SCALE;
      const causeH   = measureBlock(causes,  fullW - 18 * SCALE, 13) + 48 * SCALE;
      const pathyaH  = measureBlock(pathya,  colW  - 18 * SCALE, 13) + 48 * SCALE;
      const apathyaH = measureBlock(apathya, colW  - 18 * SCALE, 13) + 48 * SCALE;
      const colsH    = Math.max(pathyaH, apathyaH) + 10 * SCALE;
      const footerH  = 44 * SCALE;
      const totalH   = headerH + causeH + colsH + footerH + PAD;

      // ── actual canvas ─────────────────────────────────────────────────────
      const canvas = document.createElement("canvas");
      canvas.width  = W * SCALE;
      canvas.height = totalH;
      const ctx = canvas.getContext("2d")!;

      // white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ── HEADER ────────────────────────────────────────────────────────────
      ctx.fillStyle = "#1d4e3b"; // emerald-800
      ctx.fillRect(0, 0, canvas.width, headerH);

      ctx.fillStyle = "#6ee7b7"; // emerald-300
      ctx.font = `${11 * SCALE}px Arial, sans-serif`;
      ctx.fillText("Manglam Clinic · Dr. Vijay Girglani · B.A.M.S. · Reg. GBI 17318", PAD, 22 * SCALE);

      ctx.fillStyle = "#ffffff";
      ctx.font      = `bold ${22 * SCALE}px Arial, sans-serif`;
      ctx.fillText(name, PAD, 52 * SCALE);

      ctx.fillStyle = "#6ee7b7";
      ctx.font      = `${12 * SCALE}px Arial, sans-serif`;
      ctx.fillText(selected.nameEn, PAD, 68 * SCALE);

      if (patientName) {
        ctx.fillStyle = "#a7f3d0";
        ctx.font = `bold ${13 * SCALE}px Arial, sans-serif`;
        ctx.fillText(`👤 ${patientName}`, PAD, 86 * SCALE);
      }

      // date top-right
      ctx.fillStyle = "#6ee7b7";
      ctx.font      = `${11 * SCALE}px Arial, sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText(today, (W - 24) * SCALE, 22 * SCALE);
      ctx.textAlign = "left";

      // ── CAUSES ───────────────────────────────────────────────────────────
      let y = headerH;
      ctx.fillStyle = "#fffbeb"; // amber-50
      ctx.fillRect(0, y, canvas.width, causeH);

      // causes border bottom
      ctx.fillStyle = "#fde68a";
      ctx.fillRect(0, y + causeH - 2, canvas.width, 2);

      ctx.fillStyle = "#b45309"; // amber-700
      ctx.font      = `bold ${11 * SCALE}px Arial, sans-serif`;
      ctx.fillText(causesTitle.toUpperCase(), PAD, y + 20 * SCALE);
      y += 32 * SCALE;
      y = drawBulletBlock(ctx, causes, y, PAD, fullW - 18 * SCALE, "#f59e0b", "#92400e", 13);
      y = headerH + causeH;

      // ── COLUMNS ──────────────────────────────────────────────────────────
      const colsTop = y;

      // pathya column (left)
      ctx.fillStyle = "#f0fdf4";
      ctx.fillRect(0, colsTop, canvas.width / 2, colsH);

      // apathya column (right)
      ctx.fillStyle = "#fff5f5";
      ctx.fillRect(canvas.width / 2, colsTop, canvas.width / 2, colsH);

      // divider
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(canvas.width / 2 - 1, colsTop, 2, colsH);

      // pathya header
      ctx.fillStyle = "#15803d";
      ctx.font      = `bold ${14 * SCALE}px Arial, sans-serif`;
      ctx.fillText("✅  " + pathyaTitle, PAD, colsTop + 22 * SCALE);
      ctx.fillStyle = "#4ade80";
      ctx.font      = `${10 * SCALE}px Arial, sans-serif`;
      ctx.fillText(lang === "hi" ? "क्या खाएं और अपनाएं" : "શું ખાવું અને અપનાવવું", PAD + 26 * SCALE, colsTop + 36 * SCALE);

      let leftY = colsTop + 48 * SCALE;
      leftY = drawBulletBlock(ctx, pathya, leftY, PAD, colW - 18 * SCALE, "#22c55e", "#374151", 12);

      // apathya header
      const rightX = canvas.width / 2 + PAD;
      ctx.fillStyle = "#dc2626";
      ctx.font      = `bold ${14 * SCALE}px Arial, sans-serif`;
      ctx.fillText("❌  " + apathyaTitle, rightX, colsTop + 22 * SCALE);
      ctx.fillStyle = "#f87171";
      ctx.font      = `${10 * SCALE}px Arial, sans-serif`;
      ctx.fillText(lang === "hi" ? "क्या न खाएं" : "શું ન ખાવું", rightX + 26 * SCALE, colsTop + 36 * SCALE);

      let rightY = colsTop + 48 * SCALE;
      rightY = drawBulletBlock(ctx, apathya, rightY, rightX, colW - 18 * SCALE, "#ef4444", "#374151", 12);

      // ── FOOTER ───────────────────────────────────────────────────────────
      const footerY = colsTop + colsH;
      ctx.fillStyle = "#1d4e3b";
      ctx.fillRect(0, footerY, canvas.width, footerH);
      ctx.fillStyle = "#a7f3d0";
      ctx.font      = `${11 * SCALE}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(
        lang === "gu"
          ? "Manglam Clinic · Dr. Vijay Girglani · B.A.M.S. · Reg. GBI 17318"
          : "Manglam Clinic · Dr. Vijay Girglani · B.A.M.S. · Reg. GBI 17318",
        canvas.width / 2, footerY + 26 * SCALE
      );
      ctx.textAlign = "left";

      const dataUrl = canvas.toDataURL("image/png");
      setCapturedImageUrl(dataUrl);
      setShowImageShareModal(true);
    } catch (e: any) {
      alert("Image creation failed: " + e.message);
    }
    setIsCapturing(false);
  };

  const downloadAndOpenWhatsApp = () => {
    if (!capturedImageUrl) return;
    // Download the image
    const a = document.createElement("a");
    a.href = capturedImageUrl;
    const ptSuffix = patientName ? `_${patientName.replace(/\s+/g, "_")}` : "";
    a.download = `Pathya_Apathya_${selected.id}${ptSuffix}_${today.replace(/\//g, "-")}.png`;
    a.click();
    // Open WhatsApp after short delay
    setTimeout(() => {
      const number = patientMobile ? formatMobile(patientMobile) : "";
      const greeting = patientName
        ? (lang === "gu" ? `નમસ્તે ${patientName},` : `नमस्ते ${patientName},`)
        : "";
      const note = lang === "gu"
        ? `${greeting}\nManglam Clinic તરફથી તમારા માટે Pathya-Apathya માર્ગદર્શન.\nકૃપા કરીને ઉપર download થયેલ image attach કરો.`
        : `${greeting}\nManglam Clinic की तरफ से आपके लिए Pathya-Apathya मार्गदर्शन।\nकृपया ऊपर download हुई image attach करें।`;
      const url = number
        ? `https://wa.me/${number}?text=${encodeURIComponent(note)}`
        : `https://wa.me/?text=${encodeURIComponent(note)}`;
      window.open(url, "_blank");
    }, 800);
    setShowImageShareModal(false);
  };

  const filtered = diseaseSearch.length > 0
    ? allDiseases.filter(d =>
        d.nameGu.toLowerCase().includes(diseaseSearch.toLowerCase()) ||
        d.nameHi.toLowerCase().includes(diseaseSearch.toLowerCase()) ||
        d.nameEn.toLowerCase().includes(diseaseSearch.toLowerCase()))
    : allDiseases;

  return (
    <Layout>
      {/* ── Print area ── */}
      <div id="print-pathya" style={{ display:"none", fontFamily:"Arial, sans-serif", fontSize:"13px", padding:"20px", maxWidth:"720px", margin:"0 auto" }}>
        <table style={{ width:"100%", borderBottom:"3px double #2d6a4f", paddingBottom:"8px", marginBottom:"12px" }}>
          <tbody><tr>
            <td>
              <div style={{ fontSize:"18px", fontWeight:"900", color:"#2d6a4f" }}>Manglam Clinic</div>
              <div style={{ fontSize:"11px", color:"#666" }}>Ayurvedic Dietary Guidelines — Pathya-Apathya</div>
            </td>
            <td style={{ textAlign:"right", verticalAlign:"top" }}>
              <div style={{ fontWeight:"bold" }}>Dr. Vijay Girglani</div>
              <div style={{ fontSize:"11px" }}>B.A.M.S.</div>
              <div style={{ fontSize:"11px" }}>Reg. No. GBI 17318</div>
            </td>
          </tr></tbody>
        </table>
        <div style={{ background:"#2d6a4f", color:"#fff", padding:"8px 14px", borderRadius:"6px", marginBottom:"10px", display:"flex", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:"18px", fontWeight:"bold" }}>{getName()}</div>
            <div style={{ fontSize:"11px", opacity:0.85 }}>{selected.nameEn}</div>
          </div>
          <div style={{ fontSize:"12px", textAlign:"right" }}>
            {patientName && <div>Patient: {patientName}</div>}
            <div>Date: {today}</div>
          </div>
        </div>
        <div style={{ marginBottom:"10px", padding:"8px 12px", background:"#fff3cd", borderRadius:"6px" }}>
          <div style={{ fontWeight:"bold", fontSize:"12px", marginBottom:"4px" }}>{causesTitle}</div>
          <div>{getCauses().map((c,i) => <div key={i} style={{ fontSize:"12px" }}>• {c}</div>)}</div>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>
            <th style={{ background:"#d1fae5", padding:"8px", border:"1px solid #a7f3d0", width:"50%", textAlign:"left" }}>✅ {pathyaTitle}</th>
            <th style={{ background:"#fee2e2", padding:"8px", border:"1px solid #fca5a5", width:"50%", textAlign:"left" }}>❌ {apathyaTitle}</th>
          </tr></thead>
          <tbody><tr>
            <td style={{ verticalAlign:"top", padding:"10px", border:"1px solid #d1fae5" }}>
              {getPathya().map((item,j) => <div key={j} style={{ fontSize:"12px", marginBottom:"4px" }}>• {item}</div>)}
            </td>
            <td style={{ verticalAlign:"top", padding:"10px", border:"1px solid #fee2e2" }}>
              {getApathya().map((item,j) => <div key={j} style={{ fontSize:"12px", marginBottom:"4px" }}>• {item}</div>)}
            </td>
          </tr></tbody>
        </table>
      </div>

      {/* ── Main UI ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Sidebar ── */}
        <div className="lg:col-span-3 space-y-3">

          {/* Language */}
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

            {/* Patient search */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5 flex items-center gap-1">
                <User className="w-3 h-3"/> {lang==="gu" ? "દર્દી શોધો (નામ / Mobile)" : "दर्दी खोजें (नाम / Mobile)"}
              </label>
              <div ref={ptRef} className="relative">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input
                    value={ptQuery}
                    onChange={e => handlePtSearch(e.target.value)}
                    onFocus={() => ptQuery.length >= 2 && setShowPtDrop(ptResults.length > 0)}
                    placeholder={lang==="gu" ? "નામ અથવા Mobile..." : "नाम या Mobile नंबर..."}
                    className="w-full pl-8 pr-7 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-800 text-sm"
                  />
                  {ptQuery && (
                    <button onClick={clearPatient} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5"/>
                    </button>
                  )}
                </div>

                {/* Loaded patient badge */}
                {loadedPatient && (
                  <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-blue-600"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-blue-900 truncate">{loadedPatient.name}</p>
                        <p className="text-[11px] text-blue-600 font-mono">{loadedPatient.mobile}{loadedPatient.age ? ` · ${loadedPatient.age}y` : ""}</p>
                        {loadedPatient.complaint && (
                          <p className="text-[10px] text-blue-500 truncate">🏥 {loadedPatient.complaint.slice(0,40)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dropdown */}
                {showPtDrop && ptResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-y-auto z-[999]" style={{ maxHeight:"240px" }}>
                    <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{ptResults.length} {lang==="gu" ? "દર્દી" : "दर्दी"} — Register</span>
                    </div>
                    {ptResults.map((p,i) => (
                      <button key={i} onMouseDown={e => { e.preventDefault(); handleSelectPatient(p); }}
                        className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0">
                        <p className="text-sm font-bold text-slate-900">{p.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{p.mobile}{p.age ? ` · ${p.age}y` : ""}</p>
                        {p.complaint && <p className="text-[10px] text-slate-400 truncate">{p.visitDate} · {p.complaint.slice(0,30)}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Disease search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={diseaseSearch} onChange={e => setDiseaseSearch(e.target.value)}
              placeholder={lang==="hi" ? "रोग खोजें..." : "રોગ શોધો..."}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-amber-400 text-slate-700 text-sm shadow-sm"/>
          </div>

          {/* Disease list */}
          <div className="medical-card overflow-hidden">
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                {lang==="gu" ? GROUP_LABEL.gu : GROUP_LABEL.hi}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-600 font-semibold">{filtered.length} {lang==="gu" ? "રોગ" : "रोग"}</span>
                <button
                  onClick={() => setDeleteMode(v => !v)}
                  title={deleteMode ? "Exit delete mode" : "Delete diseases"}
                  className={`text-xs px-2 py-0.5 rounded-lg font-bold transition-colors ${deleteMode ? "bg-red-500 text-white" : "bg-amber-100 text-amber-600 hover:bg-red-100 hover:text-red-500"}`}>
                  {deleteMode ? (lang==="gu" ? "✕ બહાર" : "✕ बाहर") : "🗑"}
                </button>
              </div>
            </div>
            {deleteMode && (
              <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center justify-between gap-2">
                <p className="text-[11px] text-red-600 font-semibold">
                  {lang==="gu" ? "🗑 Delete Mode — રોગ પર × દબાવો" : "🗑 Delete Mode — रोग पर × दबाएं"}
                </p>
                {hiddenIds.length > 0 && (
                  <button onClick={restoreAllDiseases} className="text-[10px] text-blue-500 hover:text-blue-700 font-bold underline whitespace-nowrap">
                    {lang==="gu" ? "બધા Restore" : "सब Restore"}
                  </button>
                )}
              </div>
            )}
            <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
              {filtered.map(d => (
                <button key={d.id} onClick={() => { if (!deleteMode) setSelected(d); }}
                  className={`w-full text-left px-4 py-2.5 transition-colors ${deleteMode ? "hover:bg-red-50/60 cursor-default" : "hover:bg-amber-50/60"} ${selected.id===d.id && !deleteMode ? "bg-amber-50 border-l-4 border-amber-500" : ""}`}>
                  <div className="flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${selected.id===d.id && !deleteMode ? "text-amber-700" : "text-slate-800"}`}>
                        {lang==="gu" ? d.nameGu : d.nameHi}
                      </p>
                      <p className="text-[11px] text-slate-400">{d.nameEn}</p>
                    </div>
                    {deleteMode ? (
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmDelete(d); }}
                        title="Delete this disease"
                        className="shrink-0 text-red-400 hover:text-red-600 hover:bg-red-100 rounded p-0.5 transition-colors ml-1">
                        <X className="w-4 h-4"/>
                      </button>
                    ) : importedDiseases.find(x => x.id === d.id) ? (
                      <button
                        onClick={e => { e.stopPropagation(); removeImported(d.id); }}
                        title="Remove imported disease"
                        className="shrink-0 text-slate-300 hover:text-red-400 transition-colors ml-1">
                        <X className="w-3.5 h-3.5"/>
                      </button>
                    ) : null}
                  </div>
                  {importedDiseases.find(x => x.id === d.id) && (
                    <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold">IMPORTED</span>
                  )}
                </button>
              ))}
            </div>

            {/* ── JSON Import Button ── */}
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => { setShowImportPanel(true); setImportMsg(null); }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {lang==="gu" ? "Import — નવો રોગ ઉમેરો" : "Import — नया रोग जोड़ें"}
              </button>
              {importedDiseases.length > 0 && (
                <p className="text-center text-[10px] text-blue-500 mt-1.5 font-semibold">
                  {importedDiseases.length} {lang==="gu" ? "imported રોગ active" : "imported रोग active"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── JSON Import Modal ── */}
        {showImportPanel && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 bg-blue-600 text-white">
                <div>
                  <h3 className="font-bold text-lg">📥 Import — Disease Data</h3>
                  <p className="text-blue-200 text-xs mt-0.5">
                    {lang==="gu"
                      ? "AI Notepad (.txt) અથવા JSON ફાઇલ upload કરો — રોગ automatically add થશે"
                      : "AI Notepad (.txt) या JSON file upload करें — रोग automatically add होंगे"}
                  </p>
                </div>
                <button onClick={() => setShowImportPanel(false)} className="text-white/80 hover:text-white">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* Step 1 — File Upload */}
                <div className="border-2 border-dashed border-blue-200 rounded-2xl p-6 text-center bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" accept=".json,.txt,application/json,text/plain" className="hidden" onChange={handleFileUpload}/>
                  <div className="text-4xl mb-2">📂</div>
                  <p className="font-bold text-blue-800 text-sm">
                    {lang==="gu" ? "Notepad (.txt) અથવા JSON ફાઇલ Select કરો" : "Notepad (.txt) या JSON File Select करें"}
                  </p>
                  <p className="text-blue-500 text-xs mt-1">
                    {lang==="gu" ? "Click કરો — .txt અથવા .json બંને support" : "Click करें — .txt और .json दोनों support"}
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200"/>
                  <span className="text-xs font-bold text-slate-400">OR PASTE JSON</span>
                  <div className="flex-1 h-px bg-slate-200"/>
                </div>

                {/* Step 2 — Paste JSON */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">
                    {lang==="gu" ? "JSON Text Paste કરો:" : "JSON Text Paste करें:"}
                  </label>
                  <textarea
                    value={importJson}
                    onChange={e => setImportJson(e.target.value)}
                    rows={8}
                    placeholder={'[\n  {\n    "disease_name": { "english": "...", "hindi": "...", "gujarati": "..." },\n    "nidana": { "ahara": { "english": [...], "hindi": [...], "gujarati": [...] }, "vihara": {...} },\n    "pathya":  { "ahara": {...}, "vihara": {...} },\n    "apathya": { "ahara": {...}, "vihara": {...} }\n  }\n]'}
                    className="w-full font-mono text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none bg-slate-50 text-slate-700"
                  />
                </div>

                {/* Status message */}
                {importMsg && (
                  <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${importMsg.type==="ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {importMsg.text}
                  </div>
                )}

                {/* JSON Format Guide */}
                <details className="rounded-xl border border-slate-200 overflow-hidden">
                  <summary className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-100">
                    📋 {lang==="gu" ? "JSON Format Guide જુઓ" : "JSON Format Guide देखें"}
                  </summary>
                  <div className="px-4 py-3 text-xs text-slate-500 space-y-1 font-mono bg-white">
                    <p className="text-slate-700 font-bold font-sans mb-2">Expected structure (array or single object):</p>
                    <pre className="overflow-x-auto text-[10px] leading-relaxed">{`{
  "disease_name": {
    "english": "Kidney Stones",
    "hindi":   "अश्मरी",
    "gujarati":"અશ્મરી"
  },
  "nidana": {
    "ahara":  { "english":[...], "hindi":[...], "gujarati":[...] },
    "vihara": { "english":[...], "hindi":[...], "gujarati":[...] }
  },
  "pathya": {
    "ahara":  { "english":[...], "hindi":[...], "gujarati":[...] },
    "vihara": { "english":[...], "hindi":[...], "gujarati":[...] }
  },
  "apathya": {
    "ahara":  { "english":[...], "hindi":[...], "gujarati":[...] },
    "vihara": { "english":[...], "hindi":[...], "gujarati":[...] }
  }
}`}</pre>
                    <p className="font-sans text-[10px] text-slate-400 pt-1">Tip: Wrap multiple diseases in [ ] array. Each nidana/pathya/apathya can have ahara + vihara, both are merged automatically.</p>
                  </div>
                </details>

                {/* Imported list */}
                {importedDiseases.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-2">
                      {lang==="gu" ? "Imported રોગ (localStorage માં saved):" : "Imported रोग (localStorage में saved):"}
                    </p>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {importedDiseases.map(d => (
                        <div key={d.id} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-xs font-semibold text-blue-800">{d.nameEn}</p>
                            <p className="text-[10px] text-blue-500">{d.group}</p>
                          </div>
                          <button onClick={() => removeImported(d.id)} className="text-red-300 hover:text-red-500 transition-colors ml-3">
                            <X className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
                <p className="text-[10px] text-slate-400">
                  {lang==="gu"
                    ? "⚠️ Data browser localStorage માં save થાય છે. App reload પછી પણ available રહેશે."
                    : "⚠️ Data browser localStorage में save होता है। App reload के बाद भी available रहेगा।"}
                </p>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setShowImportPanel(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors">
                    {lang==="gu" ? "બંધ કરો" : "बंद करें"}
                  </button>
                  <button
                    onClick={() => { if (importJson.trim()) handleImport(extractJsonFromTxt(importJson)); }}
                    disabled={!importJson.trim()}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-bold transition-colors">
                    {lang==="gu" ? "Import કરો" : "Import करें"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Confirm Delete Modal ── */}
        {confirmDelete && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="text-center mb-4">
                <div className="text-4xl mb-3">🗑️</div>
                <h3 className="font-bold text-slate-800 text-lg">
                  {lang==="gu" ? "રોગ Delete કરો?" : "रोग Delete करें?"}
                </h3>
                <p className="text-sm text-slate-500 mt-1 font-semibold">{confirmDelete.nameEn}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {importedDiseases.find(x => x.id === confirmDelete.id)
                    ? (lang==="gu" ? "આ imported રોગ કાયમ માટે remove થશે." : "यह imported रोग हमेशा के लिए remove होगा।")
                    : (lang==="gu" ? "આ built-in રોગ hide થશે. ૨ ઉપર 'બધા Restore' થી પાછો આવશે." : "यह built-in रोग hide होगा। ऊपर 'सब Restore' से वापस आएगा।")}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
                  {lang==="gu" ? "રદ કરો" : "रद्द करें"}
                </button>
                <button
                  onClick={() => deleteDisease(confirmDelete)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors">
                  {lang==="gu" ? "Delete કરો" : "Delete करें"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <div className="lg:col-span-9">
          <div ref={cardRef} className="medical-card overflow-hidden">

            {/* Header */}
            <div className="bg-emerald-800 text-white p-5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 mb-2 text-emerald-300 text-xs">
                  <BookOpen className="w-4 h-4"/>
                  <span>Manglam Clinic · Dr. Vijay Girglani · B.A.M.S. · Reg. GBI 17318</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{getName()}</h2>
                <p className="text-emerald-300 text-sm mt-0.5">{selected.nameEn}</p>
                {patientName && <p className="text-emerald-200 text-sm mt-1 font-semibold">👤 {patientName}</p>}
              </div>
              <div className="text-right text-sm shrink-0">
                <p className="text-emerald-300 text-xs">{today}</p>
                <button onClick={printPathya} className="mt-2 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors ml-auto">
                  <Printer className="w-3.5 h-3.5"/> Print
                </button>
              </div>
            </div>

            {/* Causes */}
            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">{causesTitle}</p>
              <ul className="space-y-1">
                {getCauses().map((c,i) => (
                  <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="text-amber-500 shrink-0 mt-0.5">•</span>{c}
                  </li>
                ))}
              </ul>
            </div>

            {/* WhatsApp Share Bar */}
            <div className="px-5 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-green-600 text-lg shrink-0">📲</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-green-800">
                    {lang==="gu" ? "દર્દીને WhatsApp પર મોકલો" : "WhatsApp पर मरीज को भेजें"}
                  </p>
                  <p className="text-xs text-green-600 truncate">
                    {patientName
                      ? (patientMobile
                          ? `${patientName} (${patientMobile}) ને direct message જશે`
                          : `${patientName} ને message જશે`)
                      : (lang==="gu" ? "Patient Name ભરો અને Share કરો" : "Patient Name भरें और Share करें")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Image Share Button */}
                <button
                  onClick={shareAsImage}
                  disabled={isCapturing}
                  title={lang==="gu" ? "Card ની Image download કરી WhatsApp ખોલો" : "Card की Image download करके WhatsApp खोलें"}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg">
                  {isCapturing ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  )}
                  {isCapturing
                    ? (lang==="gu" ? "બનાવી રહ્યા..." : "बना रहे...")
                    : (lang==="gu" ? "📸 Image Share" : "📸 Image Share")}
                </button>
                {/* Text Share Button */}
                <button onClick={shareOnWhatsApp}
                  title={lang==="gu" ? "Text format માં share કરો" : "Text format में share करें"}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {lang==="gu" ? "Text" : "Text"}
                </button>
              </div>
            </div>

            {/* Pathya / Apathya */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">✅</span>
                  <div>
                    <h3 className="font-bold text-slate-800">{pathyaTitle}</h3>
                    <p className="text-xs text-slate-400">{lang==="hi" ? "क्या खाएं और अपनाएं" : "શું ખાવું અને અપનાવવું"}</p>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {getPathya().map((item,j) => (
                    <li key={j} className="text-sm text-slate-700 flex items-start gap-2 leading-snug">
                      <span className="text-emerald-500 shrink-0 mt-0.5 font-bold">•</span>{item}
                    </li>
                  ))}
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
                <ul className="space-y-2.5">
                  {getApathya().map((item,j) => (
                    <li key={j} className="text-sm text-slate-700 flex items-start gap-2 leading-snug">
                      <span className="text-red-400 shrink-0 mt-0.5 font-bold">•</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
        {/* ── Image Share Modal ── */}
        {showImageShareModal && capturedImageUrl && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-emerald-700 text-white">
                <div>
                  <h3 className="font-bold text-base">📸 {lang==="gu" ? "Image Ready!" : "Image Ready!"}</h3>
                  <p className="text-emerald-200 text-xs mt-0.5">
                    {lang==="gu" ? "Image download કરો અને WhatsApp માં attach કરો" : "Image download करें और WhatsApp में attach करें"}
                  </p>
                </div>
                <button onClick={() => setShowImageShareModal(false)} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              {/* Preview */}
              <div className="flex-1 overflow-y-auto p-4">
                <img src={capturedImageUrl} alt="Card preview" className="w-full rounded-xl border border-slate-200 shadow"/>

                {/* Steps */}
                <div className="mt-4 space-y-2">
                  {[
                    lang==="gu" ? "① નીચે 'Download & WhatsApp ખોલો' દબાવો" : "① नीचे 'Download & WhatsApp खोलें' दबाएं",
                    lang==="gu" ? "② Image automatically download થશે (PNG file)" : "② Image automatically download होगी (PNG file)",
                    lang==="gu" ? "③ WhatsApp chat ખુલ્લો — 📎 Attach icon → Gallery → Download folder → Image select કરો" : "③ WhatsApp chat खुलेगा — 📎 Attach → Gallery → Downloads → Image select करें",
                    lang==="gu" ? "④ Send કરો! 🎉" : "④ Send करें! 🎉",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button onClick={() => setShowImageShareModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-colors">
                  {lang==="gu" ? "રદ કરો" : "रद्द करें"}
                </button>
                <button onClick={downloadAndOpenWhatsApp}
                  className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {lang==="gu" ? "Download & WhatsApp ખોલો" : "Download & WhatsApp खोलें"}
                </button>
              </div>
            </div>
          </div>
        )}
    </Layout>
  );
}
