"""
Premium Registration Handler for New User Log
Handles pinning new user registration logs with premium duration selector
"""

import logging
from pyrogram import Client, filters, enums
from pyrogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from pyrogram.errors import ChatNotModified
from datetime import datetime, timedelta
from database.users_chats_db import db
from Script import script
from info import LOG_CHANNEL, ADMINS
from utils import temp

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


async def send_new_user_log_with_premium(client, user_id, mention, log_channel):
    """
    Send new user registration log with Add Premium button and pin it
    """
    try:
        # Create buttons for new user log
        buttons = [
            [InlineKeyboardButton("⭐ Add Premium", callback_data=f"add_premium_user_{user_id}")],
            [InlineKeyboardButton("📌 View User Info", callback_data=f"view_user_{user_id}")]
        ]
        
        reply_markup = InlineKeyboardMarkup(buttons)
        
        # Send the log message
        log_msg = await client.send_message(
            chat_id=log_channel,
            text=script.LOG_TEXT_P.format(user_id, mention),
            reply_markup=reply_markup,
            disable_web_page_preview=True,
            parse_mode=enums.ParseMode.HTML
        )
        
        # Pin the message
        try:
            await log_msg.pin(disable_notification=True)
            logger.info(f"✅ New user log pinned for user {user_id}")
        except Exception as pin_error:
            logger.warning(f"⚠️ Could not pin message: {pin_error}")
        
        return log_msg
        
    except Exception as e:
        logger.error(f"❌ Error sending new user log: {e}")
        return None


@Client.on_callback_query(filters.regex(r"^add_premium_user_"))
async def add_premium_menu(client, callback_query):
    """
    Show premium duration selection menu
    """
    try:
        user_id = int(callback_query.data.split("_")[-1])
        
        # Check if admin
        if callback_query.from_user.id not in ADMINS:
            return await callback_query.answer("❌ You don't have permission to use this!", show_alert=True)
        
        # Create duration selection keyboard
        buttons = [
            [
                InlineKeyboardButton("📅 Days", callback_data=f"premium_type_days_{user_id}"),
                InlineKeyboardButton("📆 Months", callback_data=f"premium_type_months_{user_id}"),
            ],
            [
                InlineKeyboardButton("📍 Years", callback_data=f"premium_type_years_{user_id}"),
                InlineKeyboardButton("♾️ Lifetime", callback_data=f"premium_type_lifetime_{user_id}"),
            ],
            [InlineKeyboardButton("❌ Cancel", callback_data="close_data")]
        ]
        
        reply_markup = InlineKeyboardMarkup(buttons)
        
        await callback_query.message.edit_text(
            text=f"<b>⭐ Select Premium Duration Type for User {user_id}</b>\n\n"
                 f"Choose the duration type:\n"
                 f"📅 Days - Custom days duration\n"
                 f"📆 Months - Custom months duration\n"
                 f"📍 Years - Custom years duration\n"
                 f"♾️ Lifetime - Permanent access",
            reply_markup=reply_markup,
            parse_mode=enums.ParseMode.HTML
        )
        
        await callback_query.answer()
        
    except Exception as e:
        logger.error(f"❌ Error in add_premium_menu: {e}")
        await callback_query.answer(f"❌ Error: {e}", show_alert=True)


@Client.on_callback_query(filters.regex(r"^premium_type_(days|months|years|lifetime)_"))
async def premium_duration_type(client, callback_query):
    """
    Show duration options based on selected type
    """
    try:
        data_parts = callback_query.data.split("_")
        duration_type = data_parts[2]  # days, months, years, or lifetime
        user_id = int(data_parts[3])
        
        # Check if admin
        if callback_query.from_user.id not in ADMINS:
            return await callback_query.answer("❌ You don't have permission!", show_alert=True)
        
        if duration_type == "lifetime":
            # Direct lifetime premium
            buttons = [
                [InlineKeyboardButton("✅ Confirm Lifetime", callback_data=f"confirm_premium_lifetime_{user_id}")],
                [InlineKeyboardButton("⬅️ Back", callback_data=f"add_premium_user_{user_id}")]
            ]
            
            await callback_query.message.edit_text(
                text=f"<b>♾️ Lifetime Premium for User {user_id}</b>\n\n"
                     f"This will grant permanent premium access.",
                reply_markup=InlineKeyboardMarkup(buttons),
                parse_mode=enums.ParseMode.HTML
            )
        else:
            # Show preset and custom options
            if duration_type == "days":
                preset_values = ["1", "5", "7", "15", "30"]
                emoji = "📅"
                label = "Days"
            elif duration_type == "months":
                preset_values = ["1", "2", "3", "4", "6"]
                emoji = "📆"
                label = "Months"
            else:  # years
                preset_values = ["1", "2", "3", "4", "5"]
                emoji = "📍"
                label = "Years"
            
            # Create buttons for preset values
            buttons = []
            for i in range(0, len(preset_values), 3):
                row = []
                for value in preset_values[i:i+3]:
                    row.append(InlineKeyboardButton(
                        f"{value} {label}",
                        callback_data=f"premium_preset_{duration_type}_{value}_{user_id}"
                    ))
                buttons.append(row)
            
            buttons.append([InlineKeyboardButton("🔢 Custom", callback_data=f"premium_custom_{duration_type}_{user_id}")])
            buttons.append([InlineKeyboardButton("⬅️ Back", callback_data=f"add_premium_user_{user_id}")])
            
            await callback_query.message.edit_text(
                text=f"<b>{emoji} Select {label} Duration for User {user_id}</b>\n\n"
                     f"Choose preset duration or enter custom value (1-9):",
                reply_markup=InlineKeyboardMarkup(buttons),
                parse_mode=enums.ParseMode.HTML
            )
        
        await callback_query.answer()
        
    except Exception as e:
        logger.error(f"❌ Error in premium_duration_type: {e}")
        await callback_query.answer(f"❌ Error: {e}", show_alert=True)


@Client.on_callback_query(filters.regex(r"^premium_preset_"))
async def confirm_preset_duration(client, callback_query):
    """
    Confirm preset premium duration
    """
    try:
        data_parts = callback_query.data.split("_")
        duration_type = data_parts[2]  # days, months, years
        duration_value = int(data_parts[3])
        user_id = int(data_parts[4])
        
        # Check if admin
        if callback_query.from_user.id not in ADMINS:
            return await callback_query.answer("❌ You don't have permission!", show_alert=True)
        
        # Confirmation message
        duration_labels = {
            "days": f"📅 {duration_value} Day(s)",
            "months": f"📆 {duration_value} Month(s)",
            "years": f"📍 {duration_value} Year(s)"
        }
        
        buttons = [
            [InlineKeyboardButton("✅ Confirm", callback_data=f"confirm_premium_{duration_type}_{duration_value}_{user_id}")],
            [InlineKeyboardButton("❌ Cancel", callback_data=f"add_premium_user_{user_id}")]
        ]
        
        await callback_query.message.edit_text(
            text=f"<b>✅ Confirm Premium Duration</b>\n\n"
                 f"<b>User:</b> <code>{user_id}</code>\n"
                 f"<b>Duration:</b> {duration_labels[duration_type]}\n\n"
                 f"Ready to apply premium access?",
            reply_markup=InlineKeyboardMarkup(buttons),
            parse_mode=enums.ParseMode.HTML
        )
        
        await callback_query.answer()
        
    except Exception as e:
        logger.error(f"❌ Error in confirm_preset_duration: {e}")
        await callback_query.answer(f"❌ Error: {e}", show_alert=True)


@Client.on_callback_query(filters.regex(r"^premium_custom_"))
async def custom_duration_input(client, callback_query):
    """
    Ask user to input custom duration
    """
    try:
        data_parts = callback_query.data.split("_")
        duration_type = data_parts[2]  # days, months, years
        user_id = int(data_parts[3])
        
        # Check if admin
        if callback_query.from_user.id not in ADMINS:
            return await callback_query.answer("❌ You don't have permission!", show_alert=True)
        
        duration_labels = {
            "days": "📅 Days",
            "months": "📆 Months",
            "years": "📍 Years"
        }
        
        # Create keyboard with numbers 1-9 and 0
        buttons = []
        for i in range(1, 10):
            if i % 3 == 1:
                buttons.append([])
            buttons[-1].append(InlineKeyboardButton(str(i), callback_data=f"premium_input_{duration_type}_{i}_{user_id}"))
        
        buttons.append([InlineKeyboardButton("0️⃣ Zero", callback_data=f"premium_input_{duration_type}_0_{user_id}")])
        buttons.append([InlineKeyboardButton("❌ Cancel", callback_data=f"add_premium_user_{user_id}")])
        
        await callback_query.message.edit_text(
            text=f"<b>🔢 Enter Custom Duration in {duration_labels[duration_type]}</b>\n\n"
                 f"User: <code>{user_id}</code>\n"
                 f"Select a value from 1 to 9:",
            reply_markup=InlineKeyboardMarkup(buttons),
            parse_mode=enums.ParseMode.HTML
        )
        
        await callback_query.answer()
        
    except Exception as e:
        logger.error(f"❌ Error in custom_duration_input: {e}")
        await callback_query.answer(f"❌ Error: {e}", show_alert=True)


@Client.on_callback_query(filters.regex(r"^premium_input_"))
async def confirm_custom_duration(client, callback_query):
    """
    Confirm custom duration value
    """
    try:
        data_parts = callback_query.data.split("_")
        duration_type = data_parts[2]  # days, months, years
        duration_value = int(data_parts[3])
        user_id = int(data_parts[4])
        
        # Check if admin
        if callback_query.from_user.id not in ADMINS:
            return await callback_query.answer("❌ You don't have permission!", show_alert=True)
        
        if duration_value == 0:
            await callback_query.answer("❌ Duration cannot be 0!", show_alert=True)
            return
        
        # Confirmation message
        duration_labels = {
            "days": f"📅 {duration_value} Day(s)",
            "months": f"📆 {duration_value} Month(s)",
            "years": f"📍 {duration_value} Year(s)"
        }
        
        buttons = [
            [InlineKeyboardButton("✅ Confirm", callback_data=f"confirm_premium_{duration_type}_{duration_value}_{user_id}")],
            [InlineKeyboardButton("❌ Cancel", callback_data=f"add_premium_user_{user_id}")]
        ]
        
        await callback_query.message.edit_text(
            text=f"<b>✅ Confirm Custom Premium Duration</b>\n\n"
                 f"<b>User:</b> <code>{user_id}</code>\n"
                 f"<b>Duration:</b> {duration_labels[duration_type]}\n\n"
                 f"Ready to apply premium access?",
            reply_markup=InlineKeyboardMarkup(buttons),
            parse_mode=enums.ParseMode.HTML
        )
        
        await callback_query.answer()
        
    except Exception as e:
        logger.error(f"❌ Error in confirm_custom_duration: {e}")
        await callback_query.answer(f"❌ Error: {e}", show_alert=True)


@Client.on_callback_query(filters.regex(r"^confirm_premium_"))
async def apply_premium_access(client, callback_query):
    """
    Apply premium access to user
    """
    try:
        data_parts = callback_query.data.split("_")
        
        if len(data_parts) < 4:
            await callback_query.answer("❌ Invalid request!", show_alert=True)
            return
        
        duration_type = data_parts[2]  # days, months, years
        
        try:
            duration_value = int(data_parts[3])
            user_id = int(data_parts[4])
        except (ValueError, IndexError):
            await callback_query.answer("❌ Invalid parameters!", show_alert=True)
            return
        
        # Check if admin
        if callback_query.from_user.id not in ADMINS:
            return await callback_query.answer("❌ You don't have permission!", show_alert=True)
        
        # Calculate expiry date
        now = datetime.now()
        
        if duration_type == "days":
            expiry_date = now + timedelta(days=duration_value)
        elif duration_type == "months":
            expiry_date = now + timedelta(days=30*duration_value)
        elif duration_type == "years":
            expiry_date = now + timedelta(days=365*duration_value)
        else:
            expiry_date = None
        
        # Add user to premium
        result = await db.add_premium(user_id, expiry_date)
        
        if result:
            duration_text = f"{duration_value} {duration_type.title()}"
            
            # Update message
            await callback_query.message.edit_text(
                text=f"<b>✅ Premium Access Granted!</b>\n\n"
                     f"<b>User ID:</b> <code>{user_id}</code>\n"
                     f"<b>Duration:</b> {duration_text}\n"
                     f"<b>Status:</b> ✅ Active\n"
                     f"<b>Granted by:</b> {callback_query.from_user.mention}\n"
                     f"<b>Timestamp:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                parse_mode=enums.ParseMode.HTML
            )
            
            # Send notification to user
            try:
                notify_msg = (
                    f"<b>🎉 Congratulations! You got Premium Access</b>\n\n"
                    f"<b>Duration:</b> {duration_text}\n"
                    f"<b>Benefits:</b>\n"
                    f"✅ No need to verify files\n"
                    f"✅ Direct file downloads\n"
                    f"✅ High-speed download links\n"
                    f"✅ Ad-free experience\n"
                    f"✅ Unlimited movies & series\n\n"
                    f"<b>Thank you for being part of our community!</b>"
                )
                
                await client.send_message(
                    chat_id=user_id,
                    text=notify_msg,
                    parse_mode=enums.ParseMode.HTML
                )
                
                logger.info(f"✅ Premium notification sent to user {user_id}")
            except Exception as notify_error:
                logger.warning(f"⚠️ Could not send notification to user: {notify_error}")
            
            logger.info(f"✅ Premium access granted to user {user_id} for {duration_text}")
            await callback_query.answer("✅ Premium access granted!", show_alert=True)
            
        else:
            await callback_query.answer("❌ Error adding premium access!", show_alert=True)
        
    except Exception as e:
        logger.error(f"❌ Error in apply_premium_access: {e}")
        await callback_query.answer(f"❌ Error: {e}", show_alert=True)


@Client.on_callback_query(filters.regex(r"^confirm_premium_lifetime_"))
async def apply_lifetime_premium(client, callback_query):
    """
    Apply lifetime premium access
    """
    try:
        user_id = int(callback_query.data.split("_")[-1])
        
        # Check if admin
        if callback_query.from_user.id not in ADMINS:
            return await callback_query.answer("❌ You don't have permission!", show_alert=True)
        
        # Add lifetime premium (None = lifetime)
        result = await db.add_premium(user_id, None)
        
        if result:
            # Update message
            await callback_query.message.edit_text(
                text=f"<b>✅ Lifetime Premium Access Granted!</b>\n\n"
                     f"<b>User ID:</b> <code>{user_id}</code>\n"
                     f"<b>Duration:</b> ♾️ Lifetime\n"
                     f"<b>Status:</b> ✅ Active\n"
                     f"<b>Granted by:</b> {callback_query.from_user.mention}\n"
                     f"<b>Timestamp:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                parse_mode=enums.ParseMode.HTML
            )
            
            # Send notification
            try:
                await client.send_message(
                    chat_id=user_id,
                    text="<b>🎉 Congratulations! You got Lifetime Premium Access</b>\n\n"
                         "<b>Benefits:</b>\n"
                         "✅ No need to verify files\n"
                         "✅ Direct file downloads\n"
                         "✅ High-speed download links\n"
                         "✅ Ad-free experience\n"
                         "✅ Unlimited movies & series\n\n"
                         "<b>Thank you for being part of our community!</b>",
                    parse_mode=enums.ParseMode.HTML
                )
            except Exception as e:
                logger.warning(f"Could not notify user: {e}")
            
            logger.info(f"✅ Lifetime premium granted to user {user_id}")
            await callback_query.answer("✅ Lifetime premium granted!", show_alert=True)
        else:
            await callback_query.answer("❌ Error!", show_alert=True)
        
    except Exception as e:
        logger.error(f"❌ Error in apply_lifetime_premium: {e}")
        await callback_query.answer(f"❌ Error: {e}", show_alert=True)


@Client.on_callback_query(filters.regex(r"^view_user_"))
async def view_user_info(client, callback_query):
    """
    View user information
    """
    try:
        user_id = int(callback_query.data.split("_")[-1])
        
        # Get user info from database
        user_data = await db.get_user(user_id)
        
        if user_data:
            premium_status = "✅ Premium" if await db.has_premium_access(user_id) else "❌ Free"
            
            user_info = (
                f"<b>👤 User Information</b>\n\n"
                f"<b>User ID:</b> <code>{user_id}</code>\n"
                f"<b>Status:</b> {premium_status}\n"
            )
            
            await callback_query.answer(user_info, show_alert=True)
        else:
            await callback_query.answer("❌ User not found!", show_alert=True)
        
    except Exception as e:
        logger.error(f"❌ Error in view_user_info: {e}")
        await callback_query.answer(f"❌ Error: {e}", show_alert=True)
