import { Project } from "../models/project.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { Shop } from "../models/shop.model.js";
import {
  analyzeResponsibleProject,
  parseDurationToDays,
} from "../utils/projectAnalysis.js";

// ==========================================
// 1. INDUSTRY DASHBOARD OVERVIEW
// ==========================================
export const getIndustryDashboard = async (req, res) => {
  try {
    const industryId = req.user._id;

    // Fetch projects
    const projects = await Project.find({ industry: industryId })
      .populate("assignedArtisan", "name email phone artCategory experience city state avatar")
      .sort({ createdAt: -1 });

    // Fetch orders placed by this industry partner
    const orders = await Order.find({
      $or: [{ customer: industryId }, { "shippingAddress.email": req.user.email }],
      source: "industry",
    }).sort({ createdAt: -1 });

    // Calculate metrics
    const totalRequests = projects.length || orders.length;

    const awaitingCount =
      projects.filter((p) => ["Open", "Assigned"].includes(p.status)).length ||
      orders.filter((o) => o.orderStatus === "Awaiting response").length;

    const acceptedCount =
      projects.filter((p) =>
        ["Accepted", "In Production", "Processing", "Ready to ship", "Shipped"].includes(p.status)
      ).length ||
      orders.filter((o) =>
        ["Processing", "Ready to ship", "Shipped"].includes(o.orderStatus)
      ).length;

    const completedCount =
      projects.filter((p) => p.status === "Completed").length ||
      orders.filter((o) => o.orderStatus === "Completed").length;

    // Fetch unread notifications count
    const unreadNotificationsCount = await Notification.countDocuments({
      recipient: industryId,
      isRead: false,
    });

    const recentNotifications = await Notification.find({
      recipient: industryId,
    })
      .populate("sender", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(10);

    // Fetch available artisans
    const artisans = await User.find({ accountType: "artisan" })
      .select("name email phone artCategory experience city state bio avatar")
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      stats: {
        totalRequests,
        awaitingResponse: awaitingCount,
        acceptedByArtisans: acceptedCount,
        completedProjects: completedCount,
        unreadNotificationsCount,
      },
      projects: projects.map((p) => p.toSafeObject(req.user, p.assignedArtisan)),
      orders: orders.map((o) => ({
        id: o.orderNumber || o._id.toString(),
        _id: o._id.toString(),
        createdAt: o.createdAt,
        deadline: o.deadline,
        specifications: o.specifications || "",
        items: o.items.map((i) => ({
          name: i.name || i.title,
          category: i.category,
          artisan: i.artisanName,
          price: i.price,
          quantity: i.quantity,
          status: i.itemStatus,
        })),
        subtotal: o.subtotal,
        total: o.totalAmount,
        status: o.orderStatus,
        assignedArtisan: o.items[0]?.artisanName
          ? { name: o.items[0].artisanName, id: o.items[0].artisanId?.toString() }
          : null,
      })),
      recentNotifications: recentNotifications.map((n) => n.toSafeObject()),
      availableArtisans: artisans.map((a) => a.toSafeObject()),
    });
  } catch (error) {
    console.error("Industry dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load industry dashboard data.",
    });
  }
};

// ==========================================
// 2. CREATE PROJECT / ADD PRODUCT SPECIFICATION
// ==========================================
export const createIndustryProject = async (req, res) => {
  try {
    const industryId = req.user._id;
    const {
      title,
      category,
      description,
      quantity,
      unitPrice,
      duration,
      deadline,
      specifications,
      artisanId,
      assignedArtisanId,
      materials,
      dimensions,
    } = req.body;

    if (!title?.trim() || !category?.trim() || !unitPrice || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Project title, category, quantity, and offer unit price are required.",
      });
    }

    const qty = Math.max(1, Number(quantity));
    const price = Math.max(0, Number(unitPrice));
    const targetArtisanId = assignedArtisanId || artisanId || null;

    let assignedArtisan = null;
    if (targetArtisanId) {
      assignedArtisan = await User.findById(targetArtisanId);
      if (!assignedArtisan || assignedArtisan.accountType !== "artisan") {
        return res.status(400).json({
          success: false,
          message: "The selected artisan could not be found or is not an artisan account.",
        });
      }
    }

    const durationDays = parseDurationToDays(duration, deadline);

    // Run Responsible Project Feasibility Analysis
    const responsibleAnalysis = await analyzeResponsibleProject({
      title: title.trim(),
      category: category.trim(),
      description: description?.trim() || "",
      quantity: qty,
      unitPrice: price,
      duration: duration || `${durationDays} days`,
      deadline: deadline || null,
      specifications: specifications?.trim() || "",
    });

    // Create Project
    const project = await Project.create({
      industry: industryId,
      title: title.trim(),
      category: category.trim(),
      description: description?.trim() || "",
      quantity: qty,
      unitPrice: price,
      totalBudget: price * qty,
      duration: duration?.trim() || `${durationDays} days`,
      durationDays,
      deadline: deadline ? new Date(deadline) : null,
      specifications: specifications?.trim() || "",
      dimensions: dimensions?.trim() || "",
      materials: Array.isArray(materials)
        ? materials
        : typeof materials === "string" && materials.trim()
        ? materials.split(",").map((m) => m.trim()).filter(Boolean)
        : [],
      assignedArtisan: assignedArtisan ? assignedArtisan._id : null,
      status: assignedArtisan ? "Assigned" : "Open",
      responsibleAnalysis,
    });

    let createdOrder = null;

    // If an artisan is assigned, create corresponding Order so it shows in Artisan Orders workspace
    if (assignedArtisan) {
      const orderDeadlineStr = deadline
        ? new Date(deadline).toISOString().slice(0, 10)
        : "";

      createdOrder = await Order.create({
        customer: industryId,
        customerName: req.user.contactName || req.user.name,
        customerEmail: req.user.email,
        customerPhone: req.user.phone || "",
        items: [
          {
            title: title.trim(),
            name: title.trim(),
            category: category.trim(),
            price,
            quantity: qty,
            artisanId: assignedArtisan._id,
            artisanName: assignedArtisan.name,
            itemStatus: "Awaiting response",
          },
        ],
        subtotal: price * qty,
        shipping: 0,
        totalAmount: price * qty,
        orderStatus: "Awaiting response",
        source: "industry",
        deadline: orderDeadlineStr,
        specifications: specifications?.trim() || "",
        note: `Industry production request from ${req.user.name}. ${specifications ? specifications.trim() : ""}`,
        shippingAddress: {
          fullName: req.user.contactName || req.user.name,
          phone: req.user.phone || "",
          email: req.user.email,
          address: req.user.companyAddress || req.user.city || "",
          city: req.user.city || "",
          state: req.user.state || "",
          note: `Delivery requested: ${duration || `${durationDays} days`}`,
        },
      });

      project.orderRef = createdOrder._id;
      await project.save();

      // Send notification to the artisan
      await Notification.create({
        recipient: assignedArtisan._id,
        sender: industryId,
        type: "PROJECT_ASSIGNED",
        title: `New Production Request: ${title.trim()}`,
        message: `${req.user.name} has assigned you a project "${title.trim()}" for ${qty} unit(s) at ₹${price.toLocaleString("en-IN")}/unit (Total: ₹${(price * qty).toLocaleString("en-IN")}). Requested timeline: ${duration || `${durationDays} days`}.`,
        orderId: createdOrder._id,
        projectId: project._id,
        metadata: {
          projectTitle: title.trim(),
          category: category.trim(),
          quantity: qty,
          unitPrice: price,
          totalBudget: price * qty,
          duration: duration || `${durationDays} days`,
          industryName: req.user.name,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: assignedArtisan
        ? `Order request assigned to ${assignedArtisan.name} successfully.`
        : "Project created and published to open artisan listings.",
      project: project.toSafeObject(req.user, assignedArtisan),
      order: createdOrder,
    });
  } catch (error) {
    console.error("Create project error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create project request.",
    });
  }
};

// ==========================================
// 3. GET INDUSTRY PROJECTS & ORDERS
// ==========================================
export const getIndustryProjects = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const filter = { industry: req.user._id };

    if (status && status !== "All") {
      filter.status = status;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ title: regex }, { specifications: regex }, { category: regex }];
    }

    const projects = await Project.find(filter)
      .populate("assignedArtisan", "name email phone artCategory experience city state avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects: projects.map((p) => p.toSafeObject(req.user, p.assignedArtisan)),
    });
  } catch (error) {
    console.error("Get industry projects error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve projects.",
    });
  }
};

export const getIndustryProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({
      _id: id,
      industry: req.user._id,
    }).populate("assignedArtisan", "name email phone artCategory experience city state avatar");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      project: project.toSafeObject(req.user, project.assignedArtisan),
    });
  } catch (error) {
    console.error("Get project by ID error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve project details.",
    });
  }
};

// ==========================================
// 4. ASSIGN PROJECT TO ARTISAN ACCORDING TO PRICE & TIME DURATION
// ==========================================
export const assignProjectToArtisan = async (req, res) => {
  try {
    const { id } = req.params;
    const { artisanId, agreedPrice, agreedDuration, specifications, deadline } = req.body;

    if (!artisanId) {
      return res.status(400).json({
        success: false,
        message: "Please choose an active artisan to assign this project to.",
      });
    }

    const project = await Project.findOne({ _id: id, industry: req.user._id });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project request not found.",
      });
    }

    const artisan = await User.findById(artisanId);
    if (!artisan || artisan.accountType !== "artisan") {
      return res.status(400).json({
        success: false,
        message: "The chosen user account is not a registered artisan.",
      });
    }

    // Update price or duration if specified
    if (agreedPrice && Number(agreedPrice) > 0) {
      project.unitPrice = Number(agreedPrice);
      project.totalBudget = project.unitPrice * project.quantity;
    }

    if (agreedDuration?.trim()) {
      project.duration = agreedDuration.trim();
      project.durationDays = parseDurationToDays(agreedDuration, deadline || project.deadline);
    }

    if (deadline) {
      project.deadline = new Date(deadline);
    }

    if (specifications?.trim()) {
      project.specifications = specifications.trim();
    }

    project.assignedArtisan = artisan._id;
    project.status = "Assigned";

    // Re-run responsible analysis with new pricing / duration parameters
    project.responsibleAnalysis = await analyzeResponsibleProject({
      title: project.title,
      category: project.category,
      description: project.description,
      quantity: project.quantity,
      unitPrice: project.unitPrice,
      duration: project.duration,
      deadline: project.deadline,
      specifications: project.specifications,
    });

    // Create or update linked Order
    let order = null;
    if (project.orderRef) {
      order = await Order.findById(project.orderRef);
    }

    const orderDeadlineStr = project.deadline
      ? new Date(project.deadline).toISOString().slice(0, 10)
      : "";

    if (order) {
      order.items = [
        {
          title: project.title,
          name: project.title,
          category: project.category,
          price: project.unitPrice,
          quantity: project.quantity,
          artisanId: artisan._id,
          artisanName: artisan.name,
          itemStatus: "Awaiting response",
        },
      ];
      order.subtotal = project.totalBudget;
      order.totalAmount = project.totalBudget;
      order.orderStatus = "Awaiting response";
      order.deadline = orderDeadlineStr;
      order.specifications = project.specifications;
      await order.save();
    } else {
      order = await Order.create({
        customer: req.user._id,
        customerName: req.user.contactName || req.user.name,
        customerEmail: req.user.email,
        customerPhone: req.user.phone || "",
        items: [
          {
            title: project.title,
            name: project.title,
            category: project.category,
            price: project.unitPrice,
            quantity: project.quantity,
            artisanId: artisan._id,
            artisanName: artisan.name,
            itemStatus: "Awaiting response",
          },
        ],
        subtotal: project.totalBudget,
        shipping: 0,
        totalAmount: project.totalBudget,
        orderStatus: "Awaiting response",
        source: "industry",
        deadline: orderDeadlineStr,
        specifications: project.specifications,
        shippingAddress: {
          fullName: req.user.contactName || req.user.name,
          phone: req.user.phone || "",
          email: req.user.email,
          address: req.user.companyAddress || req.user.city || "",
          city: req.user.city || "",
          state: req.user.state || "",
        },
      });
      project.orderRef = order._id;
    }

    await project.save();

    // Send notification to the artisan
    await Notification.create({
      recipient: artisan._id,
      sender: req.user._id,
      type: "PROJECT_ASSIGNED",
      title: `Project Assigned: ${project.title}`,
      message: `${req.user.name} has assigned you the project "${project.title}" for ${project.quantity} unit(s) at ₹${project.unitPrice}/item (${project.duration}).`,
      orderId: order._id,
      projectId: project._id,
      metadata: {
        projectTitle: project.title,
        price: project.unitPrice,
        duration: project.duration,
        quantity: project.quantity,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Project successfully assigned to ${artisan.name}.`,
      project: project.toSafeObject(req.user, artisan),
      order,
    });
  } catch (error) {
    console.error("Assign project error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to assign project to artisan.",
    });
  }
};

// ==========================================
// 5. ON-THE-FLY PROJECT & RESPONSIBILITY ANALYSIS
// ==========================================
export const analyzeProject = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      quantity,
      unitPrice,
      duration,
      deadline,
      specifications,
    } = req.body;

    const analysis = await analyzeResponsibleProject({
      title: title || "Handmade Craft Request",
      category: category || "Handmade Craft",
      description: description || "",
      quantity: Number(quantity) || 1,
      unitPrice: Number(unitPrice) || 0,
      duration: duration || "30 days",
      deadline: deadline || null,
      specifications: specifications || "",
    });

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Analyze project error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to analyze project feasibility.",
    });
  }
};

// ==========================================
// 6. NOTIFICATIONS FOR INDUSTRY PARTNERS
// ==========================================
export const getIndustryNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "name email avatar artCategory")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications: notifications.map((n) => n.toSafeObject()),
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve notifications.",
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      notification: notification.toSafeObject(),
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update notification.",
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update notifications.",
    });
  }
};

// ==========================================
// 7. GET AVAILABLE ARTISANS FOR ASSIGNMENT
// ==========================================
export const getAvailableArtisans = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { accountType: "artisan" };

    if (category && category !== "All") {
      filter.artCategory = new RegExp(category.trim(), "i");
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: regex },
        { artCategory: regex },
        { city: regex },
        { bio: regex },
      ];
    }

    const artisans = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    // Fetch shops for each artisan
    const artisanIds = artisans.map((a) => a._id);
    const shops = await Shop.find({ artisan: { $in: artisanIds } });
    const shopMap = new Map();
    shops.forEach((s) => shopMap.set(s.artisan.toString(), s.toSafeObject()));

    const enrichedArtisans = artisans.map((artisan) => {
      const safe = artisan.toSafeObject();
      safe.shop = shopMap.get(artisan._id.toString()) || null;
      return safe;
    });

    return res.status(200).json({
      success: true,
      artisans: enrichedArtisans,
    });
  } catch (error) {
    console.error("Get available artisans error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve artisan list.",
    });
  }
};

