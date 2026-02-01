from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, LikeViewSet, LeaderboardView, CommentViewSet

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')
router.register(r'comments', CommentViewSet, basename='comment')

urlpatterns = [
    path('', include(router.urls)),
    path('likes/', LikeViewSet.as_view({'post': 'create'}), name='like-create'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
]
