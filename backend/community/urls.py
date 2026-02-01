from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, LikeViewSet, LeaderboardView

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')
# LikeViewSet is a ViewSet but we only need 'create'. 
# Note: DefaultRouter expects basename if queryset is missing on ViewSet, but we can map manually too.
# Let's map manually for cleaner URL 'likes/'
# Actually, router is fine if we register it properly.
# But LikeViewSet doesn't have queryset.
# Let's use path for Like and Leaderboard.

urlpatterns = [
    path('', include(router.urls)),
    path('likes/', LikeViewSet.as_view({'post': 'create'}), name='like-create'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
]
