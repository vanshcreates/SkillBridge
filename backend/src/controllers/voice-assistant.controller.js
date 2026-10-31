import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Shop } from "../models/shop.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { Project } from "../models/project.model.js";
import { Notification } from "../models/notification.model.js";
import { parseArtisanIntent } from "../services/voice-assistant.service.js";

/**
 * Clean spoken text for speech synthesis (numbers to plain words, no markdown)
 */
function cleanForSpeech(text = "") {
  return text
    .replace(/[*_#`~[\]]/g, "")
    .replace(/₹\s*/g, "Rupees ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Handle incoming voice assistant conversation messages
 * @route POST /api/voice/assistant
 * @access Private (Artisan)
 */
export const handleVoiceAssistantMessage = async (req, res) => {
  try {
    const { message, conversationHistory = [], pendingAction = null, language = "pa" } = req.body || {};
    const artisanUser = req.user;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message text is required.",
      });
    }

    const trimmedMsg = message.trim();

    // Fetch current artisan shop for context
    const shop = await Shop.findOne({ artisan: artisanUser._id });

    // Step 1: Check if there is an active pendingAction awaiting confirmation or cancellation
    if (pendingAction && pendingAction.type) {
      const intentCheck = await parseArtisanIntent(trimmedMsg, {
        name: artisanUser.name,
        id: artisanUser._id.toString(),
        shopName: shop?.name || "",
      });

      // Handle Cancel / Negation
      if (intentCheck.intent === "NEGATION") {
        const reply =
          language === "pa"
            ? "ਠੀਕ ਹੈ ਜੀ, ਇਹ ਕਾਰਵਾਈ ਰੱਦ ਕਰ ਦਿੱਤੀ ਗਈ ਹੈ। ਹੋਰ ਕੀ ਮਦਦ ਕਰਾਂ?"
            : language === "hi"
            ? "ठीक है जी, यह कार्रवाई रद्द कर दी गई है। मैं आपकी और क्या मदद कर सकता हूँ?"
            : "Action cancelled. What else would you like to do?";

        return res.status(200).json({
          success: true,
          reply,
          speechText: cleanForSpeech(reply),
          pendingAction: null,
          actionData: null,
        });
      }

      // Handle Affirmation / Confirmation
      if (intentCheck.intent === "AFFIRMATION") {
        return await executeConfirmedAction(pendingAction, artisanUser, shop, language, res);
      }

      // If user provided a correction to the pending action (e.g. "change price to 2000" or "stock 15")
      if (pendingAction.type === "CONFIRM_ADD_PRODUCT" || pendingAction.type === "SLOT_FILLING_PRODUCT") {
        const numMatch = trimmedMsg.match(/\d+/);
        if (numMatch && (trimmedMsg.toLowerCase().includes("price") || trimmedMsg.toLowerCase().includes("rupee"))) {
          pendingAction.data.price = Number(numMatch[0]);
        } else if (numMatch && trimmedMsg.toLowerCase().includes("stock")) {
          pendingAction.data.stock = Number(numMatch[0]);
        } else if (!pendingAction.data.title && trimmedMsg.length > 2) {
          pendingAction.data.title = trimmedMsg;
        }

        // Re-evaluate if all fields are ready
        return await handleProductSlotFilling(pendingAction.data, artisanUser, shop, language, res);
      }
    }

    // Step 2: Parse Intent & Entities from message
    const parsed = await parseArtisanIntent(trimmedMsg, {
      name: artisanUser.name,
      id: artisanUser._id.toString(),
      shopName: shop?.name || "",
    });

    const lang = parsed.detectedLanguage || language || "pa";
    const entities = parsed.entities || {};

    // Step 3: Route to specific Intent Handlers
    switch (parsed.intent) {
      // --- A. PROFILE MANAGEMENT ---
      case "PROFILE_GET": {
        const profileReply =
          lang === "pa"
            ? `ਤੁਹਾਡਾ ਨਾਂ ${artisanUser.name} ਹੈ। ਫੋਨ ਨੰਬਰ: ${artisanUser.phone || "ਨਹੀਂ ਦੱਸਿਆ"}। ਸ਼ਹਿਰ: ${artisanUser.city || "ਪੰਜਾਬ"}। ਹੁਨਰ: ${artisanUser.artCategory || "ਦਸਤਕਾਰੀ"}। ਦੁਕਾਨ ਦਾ ਨਾਂ: ${shop?.name || "ਮੇਰੀ ਦੁਕਾਨ"}।`
            : lang === "hi"
            ? `आपका नाम ${artisanUser.name} है। फ़ोन: ${artisanUser.phone || "नहीं दिया"}। शहर: ${artisanUser.city || "भारत"}। हुनर: ${artisanUser.artCategory || "हस्तशिल्प"}। दुकान: ${shop?.name || "मेरी दुकान"}।`
            : `Your name is ${artisanUser.name}. Phone: ${artisanUser.phone || "Not set"}. Location: ${artisanUser.city || "India"}. Skills: ${artisanUser.artCategory || "Handicrafts"}. Shop: ${shop?.name || "My Shop"}.`;

        return res.status(200).json({
          success: true,
          reply: profileReply,
          speechText: cleanForSpeech(profileReply),
          pendingAction: null,
          actionData: { profile: artisanUser.toSafeObject(), shop: shop ? shop.toSafeObject() : null },
        });
      }

      case "PROFILE_UPDATE": {
        const updates = {};
        if (entities.phone) {
          const cleanP = String(entities.phone).replace(/\D/g, "");
          if (cleanP.length >= 10) updates.phone = cleanP.slice(-10);
        }
        if (entities.name) updates.name = entities.name.trim();
        if (entities.skills) updates.artCategory = entities.skills.trim();
        if (entities.city) updates.city = entities.city.trim();
        if (entities.shopName && shop) updates.shopName = entities.shopName.trim();

        if (Object.keys(updates).length === 0) {
          const promptMsg =
            lang === "pa"
              ? "ਤੁਸੀਂ ਆਪਣੇ ਪ੍ਰੋਫਾਈਲ ਵਿੱਚ ਕੀ ਬਦਲਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਜਿਵੇਂ: ਫੋਨ ਨੰਬਰ, ਨਾਂ ਜਾਂ ਹੁਨਰ।"
              : lang === "hi"
              ? "आप अपनी प्रोफाइल में क्या बदलना चाहते हैं? जैसे: फ़ोन नंबर, नाम या हुनर।"
              : "What would you like to update in your profile? E.g. phone number, name, or skills.";

          return res.status(200).json({
            success: true,
            reply: promptMsg,
            speechText: cleanForSpeech(promptMsg),
            pendingAction: null,
          });
        }

        // Set pending confirmation for profile changes
        const changeDesc = Object.entries(updates)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");

        const confirmPrompt =
          lang === "pa"
            ? `ਕੀ ਤੁਸੀਂ ਆਪਣੀ ਪ੍ਰੋਫਾਈਲ ਵਿੱਚ ਇਹ ਬਦਲਾਅ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ: ${changeDesc}? 'ਹਾਂ' ਕਹੋ ਪੁਸ਼ਟੀ ਕਰਨ ਲਈ।`
            : lang === "hi"
            ? `क्या आप अपनी प्रोफाइल में यह बदलाव करना चाहते हैं: ${changeDesc}? पुष्टि के लिए 'हाँ' बोलें।`
            : `Would you like to save these profile changes: ${changeDesc}? Say 'yes' to confirm.`;

        return res.status(200).json({
          success: true,
          reply: confirmPrompt,
          speechText: cleanForSpeech(confirmPrompt),
          pendingAction: {
            type: "CONFIRM_UPDATE_PROFILE",
            data: updates,
          },
        });
      }

      // --- B. PRODUCT MANAGEMENT ---
      case "PRODUCT_ADD": {
        const initialData = {
          title: entities.title || "",
          price: entities.price,
          stock: entities.stock,
          category: entities.category || artisanUser.artCategory || "Handicrafts",
          description: entities.description || "",
        };

        return await handleProductSlotFilling(initialData, artisanUser, shop, lang, res);
      }

      case "PRODUCT_LIST": {
        const products = await Product.find({ artisan: artisanUser._id }).sort({ createdAt: -1 });

        if (products.length === 0) {
          const noProdMsg =
            lang === "pa"
              ? "ਤੁਹਾਡੇ ਕੋਲ ਅਜੇ ਕੋਈ ਉਤਪਾਦ ਦਰਜ ਨਹੀਂ ਹੈ। ਕੀ ਤੁਸੀਂ ਨਵਾਂ ਉਤਪਾਦ ਜੋੜਨਾ ਚਾਹੁੰਦੇ ਹੋ?"
              : lang === "hi"
              ? "आपके पास अभी कोई उत्पाद लिस्ट नहीं है। क्या आप नया उत्पाद जोड़ना चाहते हैं?"
              : "You have not listed any products yet. Would you like to add one?";

          return res.status(200).json({
            success: true,
            reply: noProdMsg,
            speechText: cleanForSpeech(noProdMsg),
            pendingAction: null,
            actionData: { products: [] },
          });
        }

        const top3 = products.slice(0, 3).map((p) => `${p.title} (₹${p.price}, ਸਟਾਕ: ${p.stock})`).join(", ");
        const listReply =
          lang === "pa"
            ? `ਤੁਹਾਡੇ ਕੁੱਲ ${products.length} ਉਤਪਾਦ ਹਨ। ਜਿਵੇਂ: ${top3}।`
            : lang === "hi"
            ? `आपके कुल ${products.length} उत्पाद लिस्ट हैं। जैसे: ${top3}।`
            : `You have listed ${products.length} products. Recent items: ${top3}.`;

        return res.status(200).json({
          success: true,
          reply: listReply,
          speechText: cleanForSpeech(listReply),
          pendingAction: null,
          actionData: {
            products: products.map((p) => p.toSafeObject(artisanUser.name, shop?.location)),
          },
        });
      }

      case "PRODUCT_SEARCH": {
        const query = entities.query || "";
        const matched = await Product.find({
          artisan: artisanUser._id,
          title: new RegExp(query.trim(), "i"),
        });

        if (matched.length === 0) {
          const notFoundMsg =
            lang === "pa"
              ? `'${query}' ਨਾਂ ਦਾ ਕੋਈ ਉਤਪਾਦ ਨਹੀਂ ਮਿਲਿਆ।`
              : lang === "hi"
              ? `'${query}' नाम का कोई उत्पाद नहीं मिला।`
              : `No product found matching '${query}'.`;

          return res.status(200).json({
            success: true,
            reply: notFoundMsg,
            speechText: cleanForSpeech(notFoundMsg),
            pendingAction: null,
          });
        }

        const itemsDesc = matched.map((p) => `${p.title} (₹${p.price}, Stock: ${p.stock})`).join(", ");
        const searchReply =
          lang === "pa"
            ? `ਮੈਨੂੰ ਇਹ ਉਤਪਾਦ ਮਿਲੇ ਹਨ: ${itemsDesc}।`
            : `I found the following: ${itemsDesc}.`;

        return res.status(200).json({
          success: true,
          reply: searchReply,
          speechText: cleanForSpeech(searchReply),
          pendingAction: null,
          actionData: {
            products: matched.map((p) => p.toSafeObject(artisanUser.name, shop?.location)),
          },
        });
      }

      case "PRODUCT_UPDATE": {
        const { title, price, stock } = entities;
        let product = null;

        if (title) {
          product = await Product.findOne({
            artisan: artisanUser._id,
            title: new RegExp(title.trim(), "i"),
          });
        }
        if (!product) {
          // Default to latest product
          product = await Product.findOne({ artisan: artisanUser._id }).sort({ createdAt: -1 });
        }

        if (!product) {
          const noProd = lang === "pa" ? "ਕੋਈ ਉਤਪਾਦ ਨਹੀਂ ਮਿਲਿਆ ਜਿਸਨੂੰ ਅਪਡੇਟ ਕੀਤਾ ਜਾ ਸਕੇ।" : "No product found to update.";
          return res.status(200).json({ success: true, reply: noProd, speechText: cleanForSpeech(noProd) });
        }

        if (price === undefined && stock === undefined) {
          const askUpdate =
            lang === "pa"
              ? `ਤੁਸੀਂ '${product.title}' ਦਾ ਕੀ ਬਦਲਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਕੀਮਤ ਜਾਂ ਸਟਾਕ?`
              : `What would you like to update for '${product.title}'? Price or stock?`;

          return res.status(200).json({ success: true, reply: askUpdate, speechText: cleanForSpeech(askUpdate) });
        }

        const confirmUpdate =
          lang === "pa"
            ? `ਕੀ ਤੁਸੀਂ '${product.title}' ਦਾ ${price !== undefined ? `ਰੇਟ ₹${price}` : ""} ${stock !== undefined ? `ਸਟਾਕ ${stock}` : ""} ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ? ਪੁਸ਼ਟੀ ਲਈ 'ਹਾਂ' ਕਹੋ।`
            : `Should I update '${product.title}' to ${price !== undefined ? `Price: ₹${price}` : ""} ${stock !== undefined ? `Stock: ${stock}` : ""}? Say 'yes' to confirm.`;

        return res.status(200).json({
          success: true,
          reply: confirmUpdate,
          speechText: cleanForSpeech(confirmUpdate),
          pendingAction: {
            type: "CONFIRM_UPDATE_PRODUCT",
            data: { productId: product._id.toString(), title: product.title, price, stock },
          },
        });
      }

      case "PRODUCT_DELETE": {
        const titleQuery = entities.title || "";
        let product = null;

        if (titleQuery) {
          product = await Product.findOne({
            artisan: artisanUser._id,
            title: new RegExp(titleQuery.trim(), "i"),
          });
        }
        if (!product) {
          product = await Product.findOne({ artisan: artisanUser._id }).sort({ createdAt: -1 });
        }

        if (!product) {
          const msg = lang === "pa" ? "ਮਿਟਾਉਣ ਲਈ ਕੋਈ ਉਤਪਾਦ ਨਹੀਂ ਮਿਲਿਆ।" : "No product found to delete.";
          return res.status(200).json({ success: true, reply: msg, speechText: cleanForSpeech(msg) });
        }

        const confirmDel =
          lang === "pa"
            ? `ਕੀ ਤੁਸੀਂ ਪੱਕਾ '${product.title}' ਉਤਪਾਦ ਮਿਟਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਜੇ ਹਾਂ, ਤਾਂ 'ਹਾਂ' ਕਹੋ।`
            : lang === "hi"
            ? `क्या आप वाकई '${product.title}' को हटाना चाहते हैं? यदि हाँ, तो 'हाँ' बोलें।`
            : `Are you sure you want to delete '${product.title}'? Say 'yes' to confirm.`;

        return res.status(200).json({
          success: true,
          reply: confirmDel,
          speechText: cleanForSpeech(confirmDel),
          pendingAction: {
            type: "CONFIRM_DELETE_PRODUCT",
            data: { productId: product._id.toString(), title: product.title },
          },
        });
      }

      // --- C. ORDER MANAGEMENT ---
      case "ORDER_LIST": {
        const filter = { "items.artisanId": artisanUser._id };
        const orders = await Order.find(filter).sort({ createdAt: -1 });
        const formatted = orders.map((o) => o.toArtisanOrder(artisanUser._id));

        const pendingOrders = formatted.filter((o) =>
          ["Awaiting response", "Processing", "Ready to ship"].includes(o.status)
        );
        const completedOrders = formatted.filter((o) => o.status === "Completed");

        if (entities.status === "Pending") {
          if (pendingOrders.length === 0) {
            const noPending =
              lang === "pa"
                ? "ਤੁਹਾਡੇ ਕੋਲ ਕੋਈ ਨਵਾਂ ਜਾਂ ਪੈਂਡਿੰਗ ਆਰਡਰ ਨਹੀਂ ਹੈ।"
                : lang === "hi"
                ? "आपके पास कोई नया या पेंडिंग ऑर्डर नहीं है।"
                : "You have no pending orders.";
            return res.status(200).json({
              success: true,
              reply: noPending,
              speechText: cleanForSpeech(noPending),
              actionData: { orders: [] },
            });
          }

          const topPending = pendingOrders
            .slice(0, 3)
            .map((o) => `#${o.orderNumber || o.id.slice(-6)}: ${o.items[0]?.title} (₹${o.subtotal}) from ${o.customer?.fullName || "Customer"}`)
            .join("; ");

          const replyMsg =
            lang === "pa"
              ? `ਤੁਹਾਡੇ ਕੋਲ ${pendingOrders.length} ਪੈਂਡਿੰਗ ਆਰਡਰ ਹਨ: ${topPending}।`
              : lang === "hi"
              ? `आपके पास ${pendingOrders.length} पेंडिंग ऑर्डर हैं: ${topPending}।`
              : `You have ${pendingOrders.length} pending orders: ${topPending}.`;

          return res.status(200).json({
            success: true,
            reply: replyMsg,
            speechText: cleanForSpeech(replyMsg),
            actionData: { orders: pendingOrders },
          });
        }

        const replyAll =
          lang === "pa"
            ? `ਤੁਹਾਡੇ ਕੁੱਲ ${formatted.length} ਆਰਡਰ ਹਨ। ${pendingOrders.length} ਪੈਂਡਿੰਗ ਹਨ ਅਤੇ ${completedOrders.length} ਪੂਰੇ ਹੋ ਚੁੱਕੇ ਹਨ।`
            : lang === "hi"
            ? `आपके कुल ${formatted.length} ऑर्डर हैं। ${pendingOrders.length} पेंडिंग हैं और ${completedOrders.length} पूरे हो चुके हैं।`
            : `You have ${formatted.length} total orders. ${pendingOrders.length} are pending, and ${completedOrders.length} are completed.`;

        return res.status(200).json({
          success: true,
          reply: replyAll,
          speechText: cleanForSpeech(replyAll),
          actionData: { orders: formatted },
        });
      }

      case "ORDER_ACCEPT": {
        const orderNumberQuery = entities.orderNumber || "";
        let order = null;

        if (orderNumberQuery) {
          order = await Order.findOne({
            $or: [{ orderNumber: new RegExp(orderNumberQuery, "i") }, { _id: orderNumberQuery.match(/^[0-9a-fA-F]{24}$/) ? orderNumberQuery : null }],
            "items.artisanId": artisanUser._id,
          });
        }
        if (!order) {
          // Look for latest awaiting order
          order = await Order.findOne({
            "items.artisanId": artisanUser._id,
            orderStatus: "Awaiting response",
          }).sort({ createdAt: -1 });
        }

        if (!order) {
          const noOrder = lang === "pa" ? "ਸਵੀਕਾਰ ਕਰਨ ਲਈ ਕੋਈ ਪੈਂਡਿੰਗ ਆਰਡਰ ਨਹੀਂ ਮਿਲਿਆ।" : "No pending order found to accept.";
          return res.status(200).json({ success: true, reply: noOrder, speechText: cleanForSpeech(noOrder) });
        }

        const formatted = order.toArtisanOrder(artisanUser._id);
        const confirmAccept =
          lang === "pa"
            ? `ਕੀ ਤੁਸੀਂ ਆਰਡਰ #${order.orderNumber || order._id.toString().slice(-6)} (${formatted.items[0]?.title}, ₹${formatted.subtotal}) ਸਵੀਕਾਰ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ? 'ਹਾਂ' ਕਹੋ।`
            : `Do you want to accept order #${order.orderNumber || order._id.toString().slice(-6)} for ${formatted.items[0]?.title} totaling ₹${formatted.subtotal}? Say 'yes' to confirm.`;

        return res.status(200).json({
          success: true,
          reply: confirmAccept,
          speechText: cleanForSpeech(confirmAccept),
          pendingAction: {
            type: "CONFIRM_ACCEPT_ORDER",
            data: { orderId: order._id.toString(), orderNumber: order.orderNumber },
          },
        });
      }

      case "ORDER_COMPLETE": {
        const orderNumberQuery = entities.orderNumber || "";
        let order = null;

        if (orderNumberQuery) {
          order = await Order.findOne({
            $or: [{ orderNumber: new RegExp(orderNumberQuery, "i") }, { _id: orderNumberQuery.match(/^[0-9a-fA-F]{24}$/) ? orderNumberQuery : null }],
            "items.artisanId": artisanUser._id,
          });
        }
        if (!order) {
          order = await Order.findOne({
            "items.artisanId": artisanUser._id,
            orderStatus: { $in: ["Processing", "Ready to ship", "Shipped"] },
          }).sort({ createdAt: -1 });
        }

        if (!order) {
          const noOrder = lang === "pa" ? "ਪੂਰਾ ਕਰਨ ਲਈ ਕੋਈ ਚੱਲਦਾ ਹੋਇਆ ਆਰਡਰ ਨਹੀਂ ਮਿਲਿਆ।" : "No active order found to mark completed.";
          return res.status(200).json({ success: true, reply: noOrder, speechText: cleanForSpeech(noOrder) });
        }

        const confirmDone =
          lang === "pa"
            ? `ਕੀ ਆਰਡਰ #${order.orderNumber || order._id.toString().slice(-6)} ਪੂਰਾ ਹੋ ਗਿਆ ਹੈ? ਪੁਸ਼ਟੀ ਲਈ 'ਹਾਂ' ਕਹੋ।`
            : `Mark order #${order.orderNumber || order._id.toString().slice(-6)} as completed? Say 'yes' to confirm.`;

        return res.status(200).json({
          success: true,
          reply: confirmDone,
          speechText: cleanForSpeech(confirmDone),
          pendingAction: {
            type: "CONFIRM_COMPLETE_ORDER",
            data: { orderId: order._id.toString(), orderNumber: order.orderNumber },
          },
        });
      }

      // --- D. PAYMENTS & EARNINGS ---
      case "PAYMENT_SUMMARY":
      case "PAYMENT_PENDING":
      case "PAYMENT_HISTORY": {
        const orders = await Order.find({ "items.artisanId": artisanUser._id });
        const formattedOrders = orders.map((o) => o.toArtisanOrder(artisanUser._id));

        const completedOrders = formattedOrders.filter((o) => o.status === "Completed");
        const paidOrders = completedOrders.filter((o) => o.paymentStatus === "paid");
        const awaitingPayment = completedOrders.filter((o) => o.paymentStatus !== "paid");
        const inProgress = formattedOrders.filter((o) => ["Processing", "Ready to ship", "Shipped"].includes(o.status));

        const totalEarned = paidOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
        const pendingPayout =
          awaitingPayment.reduce((sum, o) => sum + (o.subtotal || 0), 0) +
          inProgress.reduce((sum, o) => sum + (o.subtotal || 0), 0);

        if (parsed.intent === "PAYMENT_PENDING") {
          const pendingMsg =
            lang === "pa"
              ? `ਤੁਹਾਡੀ ਬਾਕੀ ਰਕਮ ₹${pendingPayout.toLocaleString("en-IN")} ਹੈ, ਜੋ ਚੱਲ ਰਹੇ ਅਤੇ ਪੂਰੇ ਹੋਏ ਆਰਡਰਾਂ ਤੋਂ ਆਉਣੀ ਹੈ।`
              : lang === "hi"
              ? `आपकी पेंडिंग राशि ₹${pendingPayout.toLocaleString("en-IN")} है।`
              : `Your pending payout is ₹${pendingPayout.toLocaleString("en-IN")}.`;

          return res.status(200).json({
            success: true,
            reply: pendingMsg,
            speechText: cleanForSpeech(pendingMsg),
            pendingAction: null,
            actionData: { pendingPayout, totalEarned },
          });
        }

        const earnMsg =
          lang === "pa"
            ? `ਤੁਹਾਡੀ ਕੁੱਲ ਪੁਸ਼ਟੀ ਕੀਤੀ ਕਮਾਈ ₹${totalEarned.toLocaleString("en-IN")} ਹੈ। ਅਤੇ ₹${pendingPayout.toLocaleString("en-IN")} ਆਉਣਾ ਬਾਕੀ ਹੈ।`
            : lang === "hi"
            ? `आपकी कुल कमाई ₹${totalEarned.toLocaleString("en-IN")} है, और ₹${pendingPayout.toLocaleString("en-IN")} पेंडिंग है।`
            : `Your total verified earnings are ₹${totalEarned.toLocaleString("en-IN")}, with ₹${pendingPayout.toLocaleString("en-IN")} pending.`;

        return res.status(200).json({
          success: true,
          reply: earnMsg,
          speechText: cleanForSpeech(earnMsg),
          pendingAction: null,
          actionData: {
            totalEarned,
            pendingPayout,
            completedOrdersCount: completedOrders.length,
          },
        });
      }

      // --- E. DASHBOARD & BUSINESS SUMMARY ---
      case "DASHBOARD_SUMMARY": {
        const [totalProducts, orders, projects] = await Promise.all([
          Product.countDocuments({ artisan: artisanUser._id }),
          Order.find({ "items.artisanId": artisanUser._id }),
          Project.countDocuments({ assignedArtisan: artisanUser._id }),
        ]);

        const formatted = orders.map((o) => o.toArtisanOrder(artisanUser._id));
        const pendingOrdersCount = formatted.filter((o) => ["Awaiting response", "Processing"].includes(o.status)).length;
        const totalEarnings = formatted.filter((o) => o.status === "Completed" && o.paymentStatus === "paid").reduce((s, o) => s + (o.subtotal || 0), 0);

        const summaryMsg =
          lang === "pa"
            ? `ਤੁਹਾਡੇ ਕਾਰੋਬਾਰ ਦਾ ਸੰਖੇਪ: ${totalProducts} ਉਤਪਾਦ ਦਰਜ ਹਨ। ${pendingOrdersCount} ਆਰਡਰ ਪੈਂਡਿੰਗ ਹਨ। ਕੁੱਲ ਕਮਾਈ ₹${totalEarnings.toLocaleString("en-IN")} ਹੈ। ਅਤੇ ${projects} ਉਦਯੋਗ ਪ੍ਰੋਜੈਕਟ ਜੁੜੇ ਹਨ।`
            : lang === "hi"
            ? `आपके कारोबार का सारांश: ${totalProducts} उत्पाद लिस्ट हैं। ${pendingOrdersCount} ऑर्डर पेंडिंग हैं। कुल कमाई ₹${totalEarnings.toLocaleString("en-IN")} है।`
            : `Your business summary: ${totalProducts} products listed. ${pendingOrdersCount} pending orders. Total earnings: ₹${totalEarnings.toLocaleString("en-IN")}.`;

        return res.status(200).json({
          success: true,
          reply: summaryMsg,
          speechText: cleanForSpeech(summaryMsg),
          pendingAction: null,
          actionData: {
            totalProducts,
            pendingOrdersCount,
            totalEarnings,
            projectsCount: projects,
          },
        });
      }

      // --- F. INDUSTRIALISTS & COLLABORATIONS ---
      case "FIND_INDUSTRIALISTS":
      case "COLLABORATION_REQUESTS": {
        const openProjects = await Project.find({ status: "Open" })
          .populate("industry", "name industry contactName companyAddress")
          .limit(5);

        if (openProjects.length === 0) {
          const noProj =
            lang === "pa"
              ? "ਇਸ ਸਮੇਂ ਕੋਈ ਨਵਾਂ ਖੁੱਲ੍ਹਾ ਉਦਯੋਗ ਪ੍ਰੋਜੈਕਟ ਉਪਲਬਧ ਨਹੀਂ ਹੈ।"
              : "Currently no open industry collaboration projects found.";
          return res.status(200).json({ success: true, reply: noProj, speechText: cleanForSpeech(noProj) });
        }

        const projectListText = openProjects
          .slice(0, 3)
          .map((p) => `${p.title} (ਕੰਪਨੀ: ${p.industry?.name || "Industry"}, ਬਜਟ: ₹${p.unitPrice})`)
          .join("; ");

        const replyProj =
          lang === "pa"
            ? `ਮੈਨੂੰ ${openProjects.length} ਉਦਯੋਗਿਕ ਪ੍ਰੋਜੈਕਟ ਮਿਲੇ ਹਨ: ${projectListText}।`
            : `Found ${openProjects.length} industry opportunities: ${projectListText}.`;

        return res.status(200).json({
          success: true,
          reply: replyProj,
          speechText: cleanForSpeech(replyProj),
          actionData: {
            projects: openProjects.map((p) => p.toSafeObject(p.industry, null)),
          },
        });
      }

      case "COLLABORATION_ACCEPT": {
        const openProject = await Project.findOne({ status: "Open" });
        if (!openProject) {
          const noProj = lang === "pa" ? "ਸਵੀਕਾਰ ਕਰਨ ਲਈ ਕੋਈ ਪ੍ਰੋਜੈਕਟ ਨਹੀਂ ਮਿਲਿਆ।" : "No open project to accept.";
          return res.status(200).json({ success: true, reply: noProj, speechText: cleanForSpeech(noProj) });
        }

        const confirmProject =
          lang === "pa"
            ? `ਕੀ ਤੁਸੀਂ '${openProject.title}' ਪ੍ਰੋਜੈਕਟ (₹${openProject.unitPrice} ਪ੍ਰਤੀ ਨਗ) ਸਵੀਕਾਰ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ? 'ਹਾਂ' ਕਹੋ।`
            : `Do you want to accept project '${openProject.title}' at ₹${openProject.unitPrice} per unit? Say 'yes' to confirm.`;

        return res.status(200).json({
          success: true,
          reply: confirmProject,
          speechText: cleanForSpeech(confirmProject),
          pendingAction: {
            type: "CONFIRM_ACCEPT_PROJECT",
            data: { projectId: openProject._id.toString(), title: openProject.title },
          },
        });
      }

      // --- G. NOTIFICATIONS ---
      case "NOTIFICATIONS_GET": {
        const notifs = await Notification.find({ recipient: artisanUser._id }).sort({ createdAt: -1 }).limit(5);

        if (notifs.length === 0) {
          const noNotif = lang === "pa" ? "ਤੁਹਾਡੇ ਕੋਲ ਕੋਈ ਨਵੀਂ ਸੂਚਨਾ ਨਹੀਂ ਹੈ।" : "You have no new notifications.";
          return res.status(200).json({ success: true, reply: noNotif, speechText: cleanForSpeech(noNotif) });
        }

        const notifSummary = notifs.map((n) => n.title).join("; ");
        const replyN =
          lang === "pa"
            ? `ਤੁਹਾਡੀਆਂ ਤਾਜ਼ਾ ਸੂਚਨਾਵਾਂ: ${notifSummary}।`
            : `Your recent notifications: ${notifSummary}.`;

        return res.status(200).json({
          success: true,
          reply: replyN,
          speechText: cleanForSpeech(replyN),
          actionData: { notifications: notifs },
        });
      }

      // --- H. HELP & ASSISTANCE ---
      case "HELP": {
        const helpReply =
          lang === "pa"
            ? "ਮੈਂ ਤੁਹਾਡਾ ਸਕਿੱਲਬ੍ਰਿਜ ਸਹਾਇਕ ਹਾਂ। ਤੁਸੀਂ ਮੈਨੂੰ ਉਤਪਾਦ ਜੋੜਨ, ਆਰਡਰ ਦੇਖਣ ਜਾਂ ਸਵੀਕਾਰ ਕਰਨ, ਕਮਾਈ ਚੈੱਕ ਕਰਨ, ਪ੍ਰੋਫਾਈਲ ਬਦਲਣ ਜਾਂ ਫੈਕਟਰੀਆਂ ਨਾਲ ਜੁੜਨ ਲਈ ਆਵਾਜ਼ ਵਿੱਚ ਕਹਿ ਸਕਦੇ ਹੋ।"
            : lang === "hi"
            ? "मैं आपका स्किलब्रिज सहायक हूँ। आप मुझसे बोलकर उत्पाद जोड़ सकते हैं, ऑर्डर देख सकते हैं, कमाई चेक कर सकते हैं और प्रोफाइल अपडेट कर सकते हैं।"
            : "I am your SkillBridge assistant. You can speak commands to list products, check orders, accept requests, view earnings, or update your profile.";

        return res.status(200).json({
          success: true,
          reply: helpReply,
          speechText: cleanForSpeech(helpReply),
          pendingAction: null,
        });
      }

      default: {
        const defaultReply =
          lang === "pa"
            ? "ਮੈਨੂੰ ਤੁਹਾਡੀ ਗੱਲ ਪੂਰੀ ਤਰ੍ਹਾਂ ਸਮਝ ਨਹੀਂ ਆਈ ਜੀ। ਤੁਸੀਂ ਮੈਨੂੰ ਕਹਿ ਸਕਦੇ ਹੋ: 'ਮੇਰੇ ਉਤਪਾਦ ਦਿਖਾਓ', 'ਪੈਂਡਿੰਗ ਆਰਡਰ ਦਿਖਾਓ', 'ਕਮਾਈ ਕਿੰਨੀ ਹੈ', ਜਾਂ 'ਨਵਾਂ ਉਤਪਾਦ ਜੋੜੋ'।"
            : lang === "hi"
            ? "मुझे ठीक से समझ नहीं आया। आप बोल सकते हैं: 'मेरे उत्पाद दिखाओ', 'पेंडिंग ऑर्डर बताओ', 'मेरी कमाई कितनी है', या 'नया उत्पाद जोड़ो'।"
            : "I didn't quite catch that. You can ask: 'Show my products', 'Check pending orders', 'What are my earnings?', or 'Add a product'.";

        return res.status(200).json({
          success: true,
          reply: defaultReply,
          speechText: cleanForSpeech(defaultReply),
          pendingAction: null,
        });
      }
    }
  } catch (error) {
    console.error("Voice assistant message error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process assistant command.",
    });
  }
};

/**
 * Handle multi-turn slot filling for adding a product
 */
async function handleProductSlotFilling(data, artisanUser, shop, language, res) {
  // If shop doesn't exist, create default shop for artisan
  if (!shop) {
    shop = await Shop.create({
      artisan: artisanUser._id,
      name: `${artisanUser.name}'s Shop`,
      category: artisanUser.artCategory || "Handicrafts",
      location: artisanUser.city || "Punjab",
      description: artisanUser.bio || "Authentic handmade craft shop.",
    });
  }

  // Check required slots: title, price, stock
  if (!data.title) {
    const askTitle =
      language === "pa"
        ? "ਤੁਸੀਂ ਕਿਹੜਾ ਉਤਪਾਦ ਵੇਚਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਕਿਰਪਾ ਕਰਕੇ ਉਤਪਾਦ ਦਾ ਨਾਂ ਦੱਸੋ।"
        : language === "hi"
        ? "आप कौन सा उत्पाद बेचना चाहते हैं? कृपया उत्पाद का नाम बताएं।"
        : "What product would you like to sell? Please specify the name.";

    return res.status(200).json({
      success: true,
      reply: askTitle,
      speechText: cleanForSpeech(askTitle),
      pendingAction: { type: "SLOT_FILLING_PRODUCT", data },
    });
  }

  if (data.price === undefined || isNaN(data.price)) {
    const askPrice =
      language === "pa"
        ? `'${data.title}' ਦੀ ਕੀਮਤ ਕਿੰਨੀ ਰੱਖਣੀ ਹੈ? (ਜਿਵੇਂ ₹2500)`
        : language === "hi"
        ? `'${data.title}' की क्या कीमत रखनी है?`
        : `What is the price for '${data.title}'?`;

    return res.status(200).json({
      success: true,
      reply: askPrice,
      speechText: cleanForSpeech(askPrice),
      pendingAction: { type: "SLOT_FILLING_PRODUCT", data },
    });
  }

  if (data.stock === undefined || isNaN(data.stock)) {
    const askStock =
      language === "pa"
        ? `'${data.title}' ਦੇ ਕਿੰਨੇ ਨਗ (ਸਟਾਕ) ਉਪਲਬਧ ਹਨ?`
        : language === "hi"
        ? `'${data.title}' के कितने पीस (स्टॉक) उपलब्ध हैं?`
        : `How many units of '${data.title}' are available in stock?`;

    return res.status(200).json({
      success: true,
      reply: askStock,
      speechText: cleanForSpeech(askStock),
      pendingAction: { type: "SLOT_FILLING_PRODUCT", data },
    });
  }

  // All required fields present -> Ask Confirmation before saving to MongoDB
  const confirmMsg =
    language === "pa"
      ? `ਮੇਰੇ ਕੋਲ ਉਤਪਾਦ ਦਾ ਵੇਰਵਾ ਹੈ: '${data.title}', ਕੀਮਤ ₹${data.price}, ਸਟਾਕ ${data.stock} ਨਗ। ਕੀ ਮੈਂ ਇਸਨੂੰ ਮਾਰਕੀਟਪਲੇਸ ਵਿੱਚ ਜੋੜ ਦੇਵਾਂ? ਪੁਸ਼ਟੀ ਲਈ 'ਹਾਂ' ਕਹੋ।`
      : language === "hi"
      ? `मेरे पास उत्पाद विवरण है: '${data.title}', कीमत ₹${data.price}, स्टॉक ${data.stock} पीस। क्या मैं इसे जोड़ दूँ? पुष्टि के लिए 'हाँ' बोलें।`
      : `I have the product details: '${data.title}', price ₹${data.price}, stock ${data.stock} units. Should I list this product? Say 'yes' to confirm.`;

  return res.status(200).json({
    success: true,
    reply: confirmMsg,
    speechText: cleanForSpeech(confirmMsg),
    pendingAction: {
      type: "CONFIRM_ADD_PRODUCT",
      data,
    },
  });
}

/**
 * Execute actual validated database mutation upon user affirmation
 */
async function executeConfirmedAction(pendingAction, artisanUser, shop, language, res) {
  const { type, data } = pendingAction;

  switch (type) {
    case "CONFIRM_ADD_PRODUCT": {
      if (!shop) {
        shop = await Shop.findOne({ artisan: artisanUser._id });
      }

      const product = await Product.create({
        artisan: artisanUser._id,
        shop: shop?._id,
        title: data.title.trim(),
        price: Number(data.price),
        stock: Number(data.stock),
        category: data.category || artisanUser.artCategory || "Handicrafts",
        description: data.description || `Handcrafted ${data.title} by ${artisanUser.name}.`,
        status: "Published",
        isPublished: true,
      });

      const successMsg =
        language === "pa"
          ? `ਮੁਬਾਰਕਾਂ! ਤੁਹਾਡਾ ਉਤਪਾਦ '${product.title}' ਸਫਲਤਾਪੂਰਵਕ ਮਾਰਕੀਟਪਲੇਸ ਵਿੱਚ ਜੋੜ ਦਿੱਤਾ ਗਿਆ ਹੈ!`
          : language === "hi"
          ? `बधाई हो! आपका उत्पाद '${product.title}' सफलतापूर्वक लिस्ट हो गया है!`
          : `Your product '${product.title}' has been added and published successfully!`;

      return res.status(200).json({
        success: true,
        reply: successMsg,
        speechText: cleanForSpeech(successMsg),
        pendingAction: null,
        actionData: {
          product: product.toSafeObject(artisanUser.name, shop?.location),
        },
      });
    }

    case "CONFIRM_DELETE_PRODUCT": {
      await Product.findOneAndDelete({
        _id: data.productId,
        artisan: artisanUser._id,
      });

      const delMsg =
        language === "pa"
          ? `'${data.title}' ਉਤਪਾਦ ਸਫਲਤਾਪੂਰਵਕ ਮਿਟਾ ਦਿੱਤਾ ਗਿਆ ਹੈ।`
          : `'${data.title}' has been deleted successfully.`;

      return res.status(200).json({
        success: true,
        reply: delMsg,
        speechText: cleanForSpeech(delMsg),
        pendingAction: null,
      });
    }

    case "CONFIRM_UPDATE_PRODUCT": {
      const updates = {};
      if (data.price !== undefined) updates.price = Number(data.price);
      if (data.stock !== undefined) updates.stock = Number(data.stock);

      const updated = await Product.findOneAndUpdate(
        { _id: data.productId, artisan: artisanUser._id },
        { $set: updates },
        { new: true }
      );

      const updMsg =
        language === "pa"
          ? `'${data.title}' ਦਾ ਵੇਰਵਾ ਅਪਡੇਟ ਹੋ ਗਿਆ ਹੈ!`
          : `'${data.title}' details updated successfully!`;

      return res.status(200).json({
        success: true,
        reply: updMsg,
        speechText: cleanForSpeech(updMsg),
        pendingAction: null,
        actionData: { product: updated ? updated.toSafeObject(artisanUser.name, shop?.location) : null },
      });
    }

    case "CONFIRM_UPDATE_PROFILE": {
      const user = await User.findById(artisanUser._id);
      if (data.name) user.name = data.name;
      if (data.phone) user.phone = data.phone;
      if (data.city) user.city = data.city;
      if (data.artCategory) user.artCategory = data.artCategory;
      await user.save();

      if (data.shopName && shop) {
        shop.name = data.shopName;
        await shop.save();
      }

      const profMsg =
        language === "pa"
          ? "ਤੁਹਾਡੀ ਪ੍ਰੋਫਾਈਲ ਸਫਲਤਾਪੂਰਵਕ ਅਪਡੇਟ ਹੋ ਗਈ ਹੈ।"
          : "Your profile has been updated successfully.";

      return res.status(200).json({
        success: true,
        reply: profMsg,
        speechText: cleanForSpeech(profMsg),
        pendingAction: null,
        actionData: { user: user.toSafeObject() },
      });
    }

    case "CONFIRM_ACCEPT_ORDER": {
      const order = await Order.findOne({
        _id: data.orderId,
        "items.artisanId": artisanUser._id,
      });

      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found." });
      }

      order.orderStatus = "Processing";
      order.items.forEach((item) => {
        if (item.artisanId.toString() === artisanUser._id.toString()) {
          item.itemStatus = "Processing";
        }
      });
      await order.save();

      // Create notification for customer
      await Notification.create({
        recipient: order.customer,
        sender: artisanUser._id,
        type: "ORDER_ACCEPTED",
        title: `Order Accepted by ${artisanUser.name}!`,
        message: `Artisan ${artisanUser.name} has accepted your order request.`,
        orderId: order._id,
      }).catch(() => {});

      const accMsg =
        language === "pa"
          ? `ਆਰਡਰ #${order.orderNumber || order._id.toString().slice(-6)} ਸਵੀਕਾਰ ਕਰ ਲਿਆ ਗਿਆ ਹੈ! ਪ੍ਰੋਸੈਸਿੰਗ ਸ਼ੁਰੂ ਹੋ ਗਈ ਹੈ।`
          : `Order #${order.orderNumber || order._id.toString().slice(-6)} accepted! Production has started.`;

      return res.status(200).json({
        success: true,
        reply: accMsg,
        speechText: cleanForSpeech(accMsg),
        pendingAction: null,
      });
    }

    case "CONFIRM_COMPLETE_ORDER": {
      const order = await Order.findOne({
        _id: data.orderId,
        "items.artisanId": artisanUser._id,
      });

      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found." });
      }

      order.orderStatus = "Completed";
      order.items.forEach((item) => {
        if (item.artisanId.toString() === artisanUser._id.toString()) {
          item.itemStatus = "Completed";
        }
      });
      await order.save();

      const compMsg =
        language === "pa"
          ? `ਆਰਡਰ #${order.orderNumber || order._id.toString().slice(-6)} ਪੂਰਾ ਮਾਰਕ ਕਰ ਦਿੱਤਾ ਗਿਆ ਹੈ!`
          : `Order #${order.orderNumber || order._id.toString().slice(-6)} marked as completed!`;

      return res.status(200).json({
        success: true,
        reply: compMsg,
        speechText: cleanForSpeech(compMsg),
        pendingAction: null,
      });
    }

    case "CONFIRM_ACCEPT_PROJECT": {
      const project = await Project.findById(data.projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "Project not found." });
      }

      project.assignedArtisan = artisanUser._id;
      project.status = "Accepted";
      project.acceptanceDetails = {
        acceptedAt: new Date(),
        acceptedBy: artisanUser._id,
        agreedPrice: project.unitPrice,
        agreedDuration: project.duration,
      };
      await project.save();

      const projMsg =
        language === "pa"
          ? `ਪ੍ਰੋਜੈਕਟ '${project.title}' ਸਫਲਤਾਪੂਰਵਕ ਸਵੀਕਾਰ ਕਰ ਲਿਆ ਗਿਆ ਹੈ!`
          : `Project '${project.title}' has been accepted successfully!`;

      return res.status(200).json({
        success: true,
        reply: projMsg,
        speechText: cleanForSpeech(projMsg),
        pendingAction: null,
      });
    }

    default:
      return res.status(200).json({
        success: true,
        reply: "Action completed.",
        speechText: "Action completed.",
        pendingAction: null,
      });
  }
}
