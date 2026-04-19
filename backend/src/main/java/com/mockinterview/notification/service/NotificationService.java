package com.mockinterview.notification.service;

import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.notification.dto.NotificationDto;
import com.mockinterview.notification.model.Notification;
import com.mockinterview.notification.model.NotificationType;
import com.mockinterview.notification.repository.NotificationRepository;
import com.mockinterview.user.model.User;
import com.mockinterview.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service @RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void create(Long userId, String title, String message, NotificationType type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        notificationRepository.save(Notification.builder().user(user).title(title)
                .message(message).type(type).read(false).build());
    }

    public List<NotificationDto> getAll(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toDto).toList();
    }
    public List<NotificationDto> getUnread(Long userId) {
        return notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId).stream().map(this::toDto).toList();
    }
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }
    public void markAsRead(Long id, Long userId) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!n.getUser().getId().equals(userId)) throw new SecurityException("Unauthorized");
        n.setRead(true); notificationRepository.save(n);
    }
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
    private NotificationDto toDto(Notification n) {
        return NotificationDto.builder().id(n.getId()).title(n.getTitle()).message(n.getMessage())
                .type(n.getType()).read(n.isRead()).createdAt(n.getCreatedAt()).build();
    }
}
