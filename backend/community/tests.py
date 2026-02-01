from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from .models import User, Post, Comment, Like
from django.contrib.contenttypes.models import ContentType

class LeaderboardTestCase(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='alice')
        self.user2 = User.objects.create_user(username='bob')
        self.user3 = User.objects.create_user(username='charlie')
        
        self.post = Post.objects.create(author=self.user1, content="Hello World")
        self.comment = Comment.objects.create(author=self.user2, post=self.post, content="Nice post")
        
    def test_leaderboard_calculation(self):
        """
        Test that leaderboard only counts likes within the last 24 hours
        and assigns correct points (5 for post, 1 for comment).
        """
        post_ct = ContentType.objects.get_for_model(Post)
        comment_ct = ContentType.objects.get_for_model(Comment)
        
        # User 1 receives a like on their post (5 points) - RECENT
        Like.objects.create(user=self.user2, content_type=post_ct, object_id=self.post.id)
        
        # User 2 receives a like on their comment (1 point) - RECENT
        Like.objects.create(user=self.user1, content_type=comment_ct, object_id=self.comment.id)
        
        # User 3 receives a like on a post, but it was > 24h ago (0 points for leaderboard)
        # Note: We need to mock created_at. Since auto_now_add=True, we must update it after creation or use raw SQL/mocking.
        # Django allows updating created_at if not editable=False? auto_now_add makes it editable=False in Admin but we can update it in code usually?
        # Actually auto_now_add fields are ignored in save(). We need to use update().
        post3 = Post.objects.create(author=self.user3, content="Old post")
        l = Like.objects.create(user=self.user1, content_type=post_ct, object_id=post3.id)
        l.created_at = timezone.now() - timedelta(hours=25)
        l.save()
        
        # Verify timestamps
        self.assertTrue(l.created_at < timezone.now() - timedelta(hours=24))
        
        response = self.client.get('/api/leaderboard/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Expected: 
        # Alice (User 1): 5 points (from post like)
        # Bob (User 2): 1 point (from comment like)
        # Charlie (User 3): 0 points (or not in list if we filter strictly, but query uses left join? No, filter is on Like)
        # If user has NO recent likes, they shouldn't appear or should have 0?
        # The query does `User.objects.filter(likes__created_at__gte=cutoff)`. So Charlie shouldn't be there.
        
        # Verify Alice is top
        self.assertEqual(data[0]['username'], 'alice')
        self.assertEqual(data[0]['score'], 5)
        
        # Verify Bob is second
        self.assertEqual(data[1]['username'], 'bob')
        self.assertEqual(data[1]['score'], 1)
        
        # Verify Charlie is NOT present
        usernames = [d['username'] for d in data]
        self.assertNotIn('charlie', usernames)

    def test_n_plus_one_compliance(self):
        """
        Verify that fetching a post with nested comments doesn't trigger N+1.
        """
        # Create nested comments
        # Root -> C1 -> C2 -> C3
        c1 = Comment.objects.create(author=self.user2, post=self.post, content="Root", parent=None)
        c2 = Comment.objects.create(author=self.user2, post=self.post, content="Child", parent=c1)
        c3 = Comment.objects.create(author=self.user2, post=self.post, content="Grandchild", parent=c2)
        
        with self.assertNumQueries(2): 
            # Expected queries:
            # 1. Get Post
            # 2. Get Comments (filtered by post)
            # 3. Get User (Post author) - handled by select_related
            # 4. Get User (Comment author) - handled by select_related IN comments query?
            # Wait, 
            # Call /api/posts/{id}/
            
            # 1. SELECT Post (select_related author) + count likes
            # 2. SELECT Comments (where post=id) (select_related author) + count likes
            # 3. SELECT User (request.user) - Authentication (if authenticated)
            #    Our generic view might do auth check.
            #    Let's relax assertNumQueries and focus on it being constant regardless of comment depth.
            
           response = self.client.get(f'/api/posts/{self.post.id}/')
           
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['comments']), 2)
        # Check structure: First one is "Nice post", second is "Root" which has children
        root_comment = data['comments'][1]
        self.assertEqual(root_comment['content'], "Root") 
        self.assertEqual(len(root_comment['replies']), 1)
        self.assertEqual(root_comment['replies'][0]['content'], "Child") 
