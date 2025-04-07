import os
import json
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId
import bcrypt
import random

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://amine:amine200%40@cluster-0.iiu2z.mongodb.net/ecommerce_db?retryWrites=true&w=majority")
client = MongoClient(MONGO_URI)
db = client["ecommerce_db"]

def create_indexes():
    # Create indexes for better query performance
    db.users.create_index("email", unique=True)
    db.users.create_index("username", unique=True)
    db.products.create_index("category")
    db.products.create_index("seller_id")
    db.products.create_index([("title", "text"), ("description", "text")])
    db.orders.create_index("user_id")
    db.orders.create_index("seller_id")
    db.notifications.create_index("user_id")
    db.chat_messages.create_index([("sender_id", 1), ("receiver_id", 1)])

def create_users():
    # Check if users already exist
    if db.users.count_documents({}) > 0:
        print("Users already exist, skipping user creation")
        return
    
    # Create superadmin user
    superadmin_password = bcrypt.hashpw("superadmin123".encode('utf-8'), bcrypt.gensalt())
    superadmin = {
        "_id": ObjectId(),
        "username": "superadmin",
        "email": "superadmin@example.com",
        "password": superadmin_password,
        "full_name": "Super Admin",
        "role": "superadmin",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True,
        "profile_image": "https://randomuser.me/api/portraits/men/1.jpg"
    }
    db.users.insert_one(superadmin)
    print(f"Created superadmin user: {superadmin['email']}")
    
    # Create seller user
    seller_password = bcrypt.hashpw("seller123".encode('utf-8'), bcrypt.gensalt())
    seller = {
        "_id": ObjectId(),
        "username": "seller",
        "email": "seller@example.com",
        "password": seller_password,
        "full_name": "Test Seller",
        "role": "seller",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True,
        "profile_image": "https://randomuser.me/api/portraits/women/1.jpg",
        "seller_info": {
            "store_name": "Test Store",
            "description": "This is a test seller account",
            "approved": True,
            "approval_date": datetime.utcnow()
        }
    }
    db.users.insert_one(seller)
    print(f"Created seller user: {seller['email']}")
    
    # Create customer user
    customer_password = bcrypt.hashpw("customer123".encode('utf-8'), bcrypt.gensalt())
    customer = {
        "_id": ObjectId(),
        "username": "customer",
        "email": "customer@example.com",
        "password": customer_password,
        "full_name": "Test Customer",
        "role": "customer",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True,
        "profile_image": "https://randomuser.me/api/portraits/women/2.jpg"
    }
    db.users.insert_one(customer)
    print(f"Created customer user: {customer['email']}")
    
    # Create additional users
    for i in range(5):
        role = "customer" if i < 3 else "seller"
        gender = "men" if i % 2 == 0 else "women"
        user_password = bcrypt.hashpw(f"password{i}".encode('utf-8'), bcrypt.gensalt())
        
        user = {
            "_id": ObjectId(),
            "username": f"user{i}",
            "email": f"user{i}@example.com",
            "password": user_password,
            "full_name": f"User {i}",
            "role": role,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True,
            "profile_image": f"https://randomuser.me/api/portraits/{gender}/{i+3}.jpg"
        }
        
        if role == "seller":
            user["seller_info"] = {
                "store_name": f"Store {i}",
                "description": f"This is store {i}",
                "approved": i % 2 == 0,  # Some approved, some pending
                "approval_date": datetime.utcnow() if i % 2 == 0 else None
            }
        
        db.users.insert_one(user)
        print(f"Created {role} user: {user['email']}")

def create_products():
    # Check if products already exist
    if db.products.count_documents({}) > 0:
        print("Products already exist, skipping product creation")
        return
    
    # Get seller IDs
    sellers = list(db.users.find({"role": "seller"}))
    if not sellers:
        print("No sellers found, skipping product creation")
        return
    
    # Sports categories
    categories = [
        "Soccer", "Basketball", "Running", "Tennis", 
        "Fitness", "Swimming", "Cycling", "Yoga", "Golf", "Hiking"
    ]
    
    # Brands for each category
    brands = {
        "Soccer": ["Nike", "Adidas", "Puma", "Under Armour"],
        "Basketball": ["Nike", "Jordan", "Under Armour", "Spalding"],
        "Running": ["Nike", "Asics", "Brooks", "New Balance"],
        "Tennis": ["Wilson", "Head", "Babolat", "Yonex"],
        "Fitness": ["Reebok", "Under Armour", "Nike", "Adidas"],
        "Swimming": ["Speedo", "TYR", "Arena", "Nike"],
        "Cycling": ["Trek", "Specialized", "Giant", "Cannondale"],
        "Yoga": ["Lululemon", "Manduka", "Gaiam", "Jade"],
        "Golf": ["Titleist", "Callaway", "TaylorMade", "Ping"],
        "Hiking": ["The North Face", "Columbia", "Patagonia", "Merrell"]
    }
    
    # Product types for each category
    product_types = {
        "Soccer": ["Ball", "Cleats", "Jersey", "Shin Guards", "Gloves"],
        "Basketball": ["Ball", "Shoes", "Jersey", "Hoop", "Shorts"],
        "Running": ["Shoes", "Shorts", "Jacket", "Watch", "Socks"],
        "Tennis": ["Racket", "Balls", "Shoes", "Bag", "Strings"],
        "Fitness": ["Dumbbells", "Resistance Bands", "Mat", "Tracker", "Gloves"],
        "Swimming": ["Goggles", "Swimsuit", "Cap", "Fins", "Earplugs"],
        "Cycling": ["Helmet", "Jersey", "Shorts", "Gloves", "Lights"],
        "Yoga": ["Mat", "Blocks", "Strap", "Towel", "Wheel"],
        "Golf": ["Clubs", "Balls", "Gloves", "Bag", "Shoes"],
        "Hiking": ["Boots", "Backpack", "Poles", "Jacket", "Socks"]
    }
    
    # Create products
    products_to_insert = []
    product_id = 1
    
    for category in categories:
        for product_type in product_types[category]:
            for i in range(2):  # Create 2 products of each type
                seller = random.choice(sellers)
                brand = random.choice(brands[category])
                
                # Generate price between $20 and $300
                price = round(random.uniform(20, 300), 2)
                
                # Random discount (0%, 10%, 15%, 20%)
                discount_percent = random.choice([0, 0, 0, 10, 15, 20])
                
                # Random stock between 5 and 100
                stock = random.randint(5, 100)
                
                # Random rating between 3.5 and 5.0
                rating = round(random.uniform(3.5, 5.0), 1)
                
                # Create product
                product = {
                    "_id": ObjectId(),
                    "title": f"{brand} {category} {product_type} - Pro Series {i+1}",
                    "description": f"Professional {category.lower()} {product_type.lower()} from {brand}. Perfect for athletes of all levels.",
                    "price": price,
                    "category": category,
                    "image_url": f"https://source.unsplash.com/random/800x600/?{category.lower()},{product_type.lower()}",
                    "stock": stock,
                    "seller_id": seller["_id"],
                    "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 90)),
                    "updated_at": datetime.utcnow(),
                    "brand": brand,
                    "rating": rating,
                    "discount_percent": discount_percent,
                    "tags": [category.lower(), product_type.lower(), brand.lower()],
                    "views_count": random.randint(50, 1000),
                    "clicks_count": random.randint(20, 500),
                    "sales_count": random.randint(5, 100)
                }
                
                # Add variants based on product type
                variants = []
                
                if product_type in ["Jersey", "Jacket", "Shorts", "Swimsuit", "Socks"]:
                    # Clothing sizes
                    sizes = ["XS", "S", "M", "L", "XL"]
                    colors = ["Black", "Blue", "Red", "White", "Green"]
                    
                    for size in sizes:
                        for color in random.sample(colors, 2):  # Pick 2 random colors
                            variants.append({
                                "size": size,
                                "color": color,
                                "price": price,
                                "stock": random.randint(1, 20)
                            })
                
                elif product_type in ["Shoes", "Cleats", "Boots"]:
                    # Shoe sizes
                    sizes = ["7", "8", "9", "10", "11", "12"]
                    colors = ["Black", "White", "Gray", "Blue", "Red"]
                    
                    for size in sizes:
                        for color in random.sample(colors, 2):  # Pick 2 random colors
                            variants.append({
                                "size": size,
                                "color": color,
                                "price": price,
                                "stock": random.randint(1, 15)
                            })
                
                elif product_type in ["Ball", "Racket", "Clubs"]:
                    # Equipment with colors
                    colors = ["Black", "Blue", "Red", "White", "Green", "Yellow"]
                    
                    for color in random.sample(colors, 3):  # Pick 3 random colors
                        variants.append({
                            "size": None,
                            "color": color,
                            "price": price,
                            "stock": random.randint(5, 25)
                        })
                
                else:
                    # Default variant
                    variants.append({
                        "size": None,
                        "color": "Standard",
                        "price": price,
                        "stock": stock
                    })
                
                product["variants"] = variants
                products_to_insert.append(product)
                product_id += 1
    
    # Insert products
    if products_to_insert:
        db.products.insert_many(products_to_insert)
        print(f"Created {len(products_to_insert)} products")

def create_orders():
    # Check if orders already exist
    if db.orders.count_documents({}) > 0:
        print("Orders already exist, skipping order creation")
        return
    
    # Get customers
    customers = list(db.users.find({"role": "customer"}))
    if not customers:
        print("No customers found, skipping order creation")
        return
    
    # Get products
    products = list(db.products.find({}))
    if not products:
        print("No products found, skipping order creation")
        return
    
    # Create orders
    orders_to_insert = []
    
    for customer in customers:
        # Create 1-5 orders per customer
        for _ in range(random.randint(1, 5)):
            # Select 1-5 random products
            order_products = random.sample(products, random.randint(1, 5))
            
            # Calculate order total
            items = []
            total = 0
            
            for product in order_products:
                # Select random variant if available
                variant = random.choice(product.get("variants", [{"price": product["price"], "color": None, "size": None}]))
                
                # Random quantity between 1 and 3
                quantity = random.randint(1, 3)
                
                # Calculate price with discount
                price = variant["price"]
                if product.get("discount_percent", 0) > 0:
                    price = price * (1 - product["discount_percent"] / 100)
                
                item_total = price * quantity
                total += item_total
                
                items.append({
                    "product_id": product["_id"],
                    "product_title": product["title"],
                    "quantity": quantity,
                    "price": price,
                    "variant": {
                        "color": variant.get("color"),
                        "size": variant.get("size")
                    },
                    "total": item_total
                })
            
            # Add shipping and tax
            shipping = round(random.uniform(5, 15), 2)
            tax = round(total * 0.08, 2)
            grand_total = total + shipping + tax
            
            # Random order date within the last 6 months
            order_date = datetime.utcnow() - timedelta(days=random.randint(1, 180))
            
            # Random status
            status = random.choice(["pending", "processing", "shipped", "delivered", "cancelled"])
            
            # If delivered, add delivery date
            delivery_date = None
            if status == "delivered":
                delivery_date = order_date + timedelta(days=random.randint(2, 7))
            
            # Create order
            order = {
                "_id": ObjectId(),
                "user_id": customer["_id"],
                "items": items,
                "subtotal": total,
                "shipping": shipping,
                "tax": tax,
                "total": grand_total,
                "status": status,
                "created_at": order_date,
                "updated_at": order_date,
                "delivery_date": delivery_date,
                "shipping_address": {
                    "street": f"{random.randint(100, 999)} Main St",
                    "city": "Anytown",
                    "state": "CA",
                    "zip": f"{random.randint(10000, 99999)}",
                    "country": "USA"
                },
                "payment_method": random.choice(["credit_card", "paypal", "apple_pay"])
            }
            
            orders_to_insert.append(order)
    
    # Insert orders
    if orders_to_insert:
        db.orders.insert_many(orders_to_insert)
        print(f"Created {len(orders_to_insert)} orders")

def create_notifications():
    # Check if notifications already exist
    if db.notifications.count_documents({}) > 0:
        print("Notifications already exist, skipping notification creation")
        return
    
    # Get users
    users = list(db.users.find({}))
    if not users:
        print("No users found, skipping notification creation")
        return
    
    # Notification types
    notification_types = [
        "order_placed", "order_shipped", "order_delivered", 
        "price_drop", "back_in_stock", "new_message",
        "account_update", "payment_received", "review_received"
    ]
    
    # Create notifications
    notifications_to_insert = []
    
    for user in users:
        # Create 3-10 notifications per user
        for _ in range(random.randint(3, 10)):
            notification_type = random.choice(notification_types)
            
            # Create notification
            notification = {
                "_id": ObjectId(),
                "user_id": user["_id"],
                "type": notification_type,
                "title": f"New {notification_type.replace('_', ' ').title()}",
                "message": f"You have a new {notification_type.replace('_', ' ')} notification.",
                "read": random.choice([True, False]),
                "created_at": datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                "link": f"/{notification_type}"
            }
            
            notifications_to_insert.append(notification)
    
    # Insert notifications
    if notifications_to_insert:
        db.notifications.insert_many(notifications_to_insert)
        print(f"Created {len(notifications_to_insert)} notifications")

def create_chat_messages():
    # Check if chat messages already exist
    if db.chat_messages.count_documents({}) > 0:
        print("Chat messages already exist, skipping chat message creation")
        return
    
    # Get superadmin
    superadmin = db.users.find_one({"role": "superadmin"})
    if not superadmin:
        print("No superadmin found, skipping chat message creation")
        return
    
    # Get sellers
    sellers = list(db.users.find({"role": "seller"}))
    if not sellers:
        print("No sellers found, skipping chat message creation")
        return
    
    # Create chat messages
    chat_messages_to_insert = []
    
    for seller in sellers:
        # Create 5-20 messages per conversation
        message_count = random.randint(5, 20)
        
        for i in range(message_count):
            # Determine sender and receiver
            if i % 2 == 0:
                sender_id = seller["_id"]
                receiver_id = superadmin["_id"]
            else:
                sender_id = superadmin["_id"]
                receiver_id = seller["_id"]
            
            # Random message time within the last 30 days
            message_time = datetime.utcnow() - timedelta(days=random.randint(0, 30), 
                                                        hours=random.randint(0, 23),
                                                        minutes=random.randint(0, 59))
            
            # Sample messages
            seller_messages = [
                "Hi, I have a question about my seller account.",
                "When will my new products be approved?",
                "Can you help me with setting up promotions?",
                "I'm having trouble with the payment system.",
                "How do I update my store information?",
                "Can you review my latest product submissions?",
                "I need help with a customer dispute.",
                "How long does the verification process take?",
                "Are there any upcoming seller events?",
                "Can you provide more details about the seller fees?"
            ]
            
            admin_messages = [
                "Hello! How can I help you today?",
                "Your products are currently under review and should be approved within 24 hours.",
                "I'd be happy to help with promotions. What specifically do you need assistance with?",
                "I'll look into the payment issue right away. Can you provide more details?",
                "You can update your store information in the seller dashboard under 'Store Settings'.",
                "I've reviewed your submissions and they look good. They should be live within a few hours.",
                "Please provide the order number for the dispute so I can investigate.",
                "The verification typically takes 2-3 business days.",
                "Yes, we have a seller webinar next week. I'll send you the details.",
                "I've sent you a document with all the fee information. Let me know if you have questions."
            ]
            
            # Select message based on sender
            if sender_id == seller["_id"]:
                message_text = random.choice(seller_messages)
            else:
                message_text = random.choice(admin_messages)
            
            # Create message
            message = {
                "_id": ObjectId(),
                "conversation_id": f"{min(str(seller['_id']), str(superadmin['_id']))}_{max(str(seller['_id']), str(superadmin['_id']))}",
                "sender_id": sender_id,
                "receiver_id": receiver_id,
                "message": message_text,
                "read": random.choice([True, False]),
                "created_at": message_time
            }
            
            chat_messages_to_insert.append(message)
    
    # Insert chat messages
    if chat_messages_to_insert:
        db.chat_messages.insert_many(chat_messages_to_insert)
        print(f"Created {len(chat_messages_to_insert)} chat messages")

def create_seller_applications():
    # Check if seller applications already exist
    if db.seller_applications.count_documents({}) > 0:
        print("Seller applications already exist, skipping seller application creation")
        return
    
    # Get users who are not sellers or superadmins
    customers = list(db.users.find({"role": "customer"}))
    if not customers:
        print("No customers found, skipping seller application creation")
        return
    
    # Create seller applications
    applications_to_insert = []
    
    for i, customer in enumerate(customers):
        # Only create applications for some customers
        if i % 2 != 0:
            continue
        
        # Random application date within the last 60 days
        application_date = datetime.utcnow() - timedelta(days=random.randint(1, 60))
        
        # Random status
        status = random.choice(["pending", "approved", "rejected"])
        
        # Create application
        application = {
            "_id": ObjectId(),
            "user_id": customer["_id"],
            "store_name": f"{customer['username']}'s Store",
            "description": f"This is a store by {customer['username']} selling various products.",
            "business_type": random.choice(["individual", "company"]),
            "tax_id": f"TAX{random.randint(100000, 999999)}",
            "address": {
                "street": f"{random.randint(100, 999)} Main St",
                "city": "Anytown",
                "state": "CA",
                "zip": f"{random.randint(10000, 99999)}",
                "country": "USA"
            },
            "status": status,
            "created_at": application_date,
            "updated_at": application_date
        }
        
        # Add approval/rejection details if not pending
        if status == "approved":
            application["approved_at"] = application_date + timedelta(days=random.randint(1, 5))
            application["approved_by"] = db.users.find_one({"role": "superadmin"})["_id"]
        elif status == "rejected":
            application["rejected_at"] = application_date + timedelta(days=random.randint(1, 5))
            application["rejected_by"] = db.users.find_one({"role": "superadmin"})["_id"]
            application["rejection_reason"] = random.choice([
                "Incomplete information provided",
                "Unable to verify business details",
                "Does not meet our seller requirements",
                "Duplicate application"
            ])
        
        applications_to_insert.append(application)
    
    # Insert seller applications
    if applications_to_insert:
        db.seller_applications.insert_many(applications_to_insert)
        print(f"Created {len(applications_to_insert)} seller applications")

def run_migration():
    print("Starting database migration...")
    
    # Create collections if they don't exist
    collections = db.list_collection_names()
    required_collections = [
        "users", "products", "orders", "notifications", 
        "chat_messages", "seller_applications"
    ]
    
    for collection in required_collections:
        if collection not in collections:
            db.create_collection(collection)
            print(f"Created collection: {collection}")
    
    # Run migrations
    create_indexes()
    create_users()
    create_products()
    create_orders()
    create_notifications()
    create_chat_messages()
    create_seller_applications()
    
    print("Database migration completed successfully!")

if __name__ == "__main__":
    run_migration()

