from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Sum, Case, When, IntegerField, F, Prefetch, OuterRef, Subquery, Value
from django.db.models.functions import Coalesce
from django.db import IntegrityError, transaction
from django.utils import timezone
from datetime import timedelta
from django.contrib.contenttypes.models import ContentType

from .models import Post, Comment, Like, User
from .serializers import PostSerializer, PostDetailSerializer, CommentSerializer, LikeSerializer, LeaderboardSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().select_related('author').annotate(
        likes_count=Count('likes')
    ).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PostDetailSerializer
        return PostSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        comments = Comment.objects.filter(post=instance).select_related('author').annotate(
            likes_count=Count('likes')
        ).order_by('created_at')
        
        comment_map = {c.id: c for c in comments}
        roots = []
        
        for comment in comments:
            comment._replies = []
            
        for comment in comments:
            if comment.parent_id:
                parent = comment_map.get(comment.parent_id)
                if parent:
                    parent._replies.append(comment)
            else:
                roots.append(comment)
                
        instance._precomputed_comments = roots
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class LikeViewSet(viewsets.ViewSet):
    def create(self, request):
        serializer = LikeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            data = serializer.save()
            try:
                Like.objects.create(
                    user=data['user'],
                    content_type=data['content_type'],
                    object_id=data['object_id']
                )
                return Response({'status': 'liked'}, status=status.HTTP_201_CREATED)
            except IntegrityError:
                return Response({'status': 'already liked'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LeaderboardView(generics.ListAPIView):
    serializer_class = LeaderboardSerializer
    
    def get_queryset(self):
        cutoff = timezone.now() - timedelta(hours=24)
        
        # Karma from Posts (5 points per like)
        
        # Karma from Posts (5 points per like) using Subquery to avoid cross-product joins
        # Simplified Subquery:
        # We want to select Sum(likes) from Like joined with Post where Post.author = OuterRef.

        
        posts_karma_sq = Subquery(
            Post.objects.filter(author=OuterRef('pk'))
            .values('author')
            .annotate(
                s=Sum(
                    Case(When(likes__created_at__gte=cutoff, then=5), default=0, output_field=IntegerField())
                )
            )
            .values('s')
        )

        comments_karma_sq = Subquery(
            Comment.objects.filter(author=OuterRef('pk'))
            .values('author')
            .annotate(
                s=Sum(
                    Case(When(likes__created_at__gte=cutoff, then=1), default=0, output_field=IntegerField())
                )
            )
            .values('s')
        )

        return User.objects.annotate(
            score=Coalesce(posts_karma_sq, Value(0)) + Coalesce(comments_karma_sq, Value(0))
        ).filter(score__gt=0).order_by('-score')[:5]
